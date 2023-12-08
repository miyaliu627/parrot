import '../styles/globals.css';
import '@mantine/core/styles.css';
import type { AppProps } from 'next/app';
import { MantineProvider } from '@mantine/core';
import Head from 'next/head';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider>
      <Head>
        <title>Parrot: PDF Text to Speech Conversion</title>
      </Head>
      <Component {...pageProps} />
    </MantineProvider>
  );
}

export default MyApp;
