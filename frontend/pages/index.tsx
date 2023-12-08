"use client";
import App from '../lib/components/App';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import store, { persistor } from '../lib/store/reducer';
import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Parrot: PDF Text to Speech Conversion</title>
      </Head>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App/>
        </PersistGate>
      </Provider>
    </>

  )
}
