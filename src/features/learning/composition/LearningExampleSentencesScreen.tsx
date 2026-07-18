import React from 'react';

import PresentationExampleSentencesScreen from '../presentation/screens/ExampleSentencesScreen';
import { exampleSentencesFacade } from './exampleSentencesFacade';

export default function ExampleSentencesScreen() {
  return <PresentationExampleSentencesScreen facade={exampleSentencesFacade} />;
}
