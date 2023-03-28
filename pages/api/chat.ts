import type { NextApiRequest, NextApiResponse } from 'next'; // Next.js types
import { OpenAIEmbeddings } from 'langchain/embeddings';//embeddings from langchain library 
import { PineconeStore } from 'langchain/vectorstores';//vectorstore from langchain library 
import { makeChain } from '@/utils/makechain';//makechain function from utils folder 
import { pinecone } from '@/utils/pinecone-client';//pinecone client from utils folder 
import { PINECONE_INDEX_NAME, PINECONE_NAME_SPACE } from '@/config/pinecone';// index name and namespace from config folder

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction 
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // get the question and history from the request body 
  const { question, history } = req.body;

  // check if the question is present in the request body 
  if (!question) {
    // if not, return a 400 status code and a message 
    return res.status(400).json({ message: 'No question in the request' });
  }
  // OpenAI recommends replacing newlines with spaces for best results
  const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

  // create a new index with the name of the index in Pinecone
  const index = pinecone.Index(PINECONE_INDEX_NAME);

  /* create vectorstore */
  // create a new vector store from the index and embeddings (OpenAI) 
  // and the name of the field in the index that contains the text to be embedded (text)
  const vectorStore = await PineconeStore.fromExistingIndex(
    index,
    new OpenAIEmbeddings({}),
    'text',
    PINECONE_NAME_SPACE, //optional namespace to use for the index (default is 'default') 
  );

  // set headers for SSE (Server Sent Events) to enable real-time updates to the client (browser)
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  // send data to the client (browser) in the form of a string with the prefix 'data: '
  const sendData = (data: string) => {
    res.write(`data: ${data}\n\n`);
  };

  // send an empty string to the client (browser) to indicate that the connection is open and ready to receive data 
  sendData(JSON.stringify({ data: '' }));

  // create a new chain with the vectorStore and a callback function that will be called when a response is received
  // the callback function will send the response to the client (browser)
  const chain = makeChain(vectorStore, (token: string) => {
    console.log(token);
    sendData(JSON.stringify({ data: token }));
  });

  try {
    //Ask a question to the chain and get a response from the chain 
    const response = await chain.call({
      question: sanitizedQuestion,
      chat_history: history || [],
    });

    console.log('response', response);
    console.log('sourceDocs:', response.sourceDocuments)
    // send the response to the client (browser) 
    sendData(JSON.stringify({ sourceDocs: response.sourceDocuments }));
  } catch (error) {
    console.log('error', error);
  } finally {
    // send the string '[DONE]' to the client (browser) to indicate that the connection is closed
    sendData('[DONE]');
    res.end();
  }
}
