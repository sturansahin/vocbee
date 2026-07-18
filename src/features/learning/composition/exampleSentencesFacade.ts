import { DefaultExampleSentencesFacade } from '../application/DefaultExampleSentencesFacade';
import { ExpoExampleSentencesPlatformGateway } from '../data/ExpoExampleSentencesPlatformGateway';
import { explainGrammar } from './grammarService';

const grammarSource = { explain: explainGrammar };

export const exampleSentencesFacade = new DefaultExampleSentencesFacade(
  grammarSource,
  new ExpoExampleSentencesPlatformGateway(),
);
