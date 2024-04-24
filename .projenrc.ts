import { awscdk } from 'projen';
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Matthew Bonig',
  authorAddress: 'matthew.bonig@gmail.com',
  cdkVersion: '2.132.0',
  defaultReleaseBranch: 'main',
  jsiiVersion: '~5.0.0',
  name: 'twingate-connnectors',
  projenrcTs: true,
  repositoryUrl: 'https://github.com/matthew.bonig/twingate-connnectors.git',
});
project.synth();
