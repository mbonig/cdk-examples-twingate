import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { InstanceType, Vpc } from 'aws-cdk-lib/aws-ec2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { TwingateConnector } from '../src/TwingateConnector';

describe('TwingateConnector', () => {
  let stack: Stack;
  let vpc: Vpc;

  beforeEach(() => {
    const app = new App({
      context: {
        'ami:account=123456789012:filters.image-type.0=machine:filters.name.0=twingate/images/hvm-ssd/twingate-amd64-*:filters.state.0=available:owners.0=617935088040:region=us-east-1': 'ami-0cdbb12f99c43b027',
      },
    });
    stack = new Stack(app, 'test', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    vpc = new Vpc(stack, 'Vpc');

  });

  test('Basic Snapshot', () => {
    new TwingateConnector(stack, 'TwingateConnector', {
      vpc,
      twingateUrl: 'https://some-test-url.twingate.com',
    });
    const assert = Template.fromStack(stack);
    expect(assert.toJSON()).toMatchSnapshot();
  });

  test('More connectors', () => {
    new TwingateConnector(stack, 'TwingateConnector', {
      vpc,
      twingateUrl: 'https://some-test-url.twingate.com',
      connectorCount: 3,
    });
    const assert = Template.fromStack(stack);
    expect(assert.toJSON()).toMatchSnapshot();
  });

  test('Overridden instance types', () => {
    new TwingateConnector(stack, 'TwingateConnector', {
      vpc,
      twingateUrl: 'https://some-test-url.twingate.com',
      connectorCount: 3,
      instanceType: InstanceType.of(ec2.InstanceClass.M5A, ec2.InstanceSize.MEDIUM),
    });
    const assert = Template.fromStack(stack);
    expect(assert.toJSON()).toMatchSnapshot();
  });
});

