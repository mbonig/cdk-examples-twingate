import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { Vpc } from 'aws-cdk-lib/aws-ec2';
import { AccountPrincipal, Role } from 'aws-cdk-lib/aws-iam';
import { TwingateConnector } from '../src/TwingateConnector';

describe('TwingateConnector', () => {
  function createStack() {
    const app = new App();
    const stack = new Stack(app, 'test', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    const vpc = new Vpc(stack, 'Vpc');
    return { stack, vpc };
  }

  describe('Input Validation', () => {
    test('throws if no twingate url', () => {
      // arrange
      const { stack, vpc } = createStack();

      // act and assert
      expect(() => new TwingateConnector(stack, 'TwingateConnector', {
        vpc: vpc,
        twingateUrl: '',
      })).toThrow('twingateUrl is required, this should be something like `https://example.twingate.com`');
    });

    test('throws if not valid https url', () => {
      // arrange
      const { stack, vpc } = createStack();

      // act and assert
      expect(() => new TwingateConnector(stack, 'TwingateConnector', {
        vpc: vpc,
        twingateUrl: 'somethingButNotCorrect',
      })).toThrow('twingateUrl is required, this should be something like `https://example.twingate.com`');
    });
  });

  describe('Shared Configuration', () => {
    const createdInstanceRoleProperties = {
      AssumeRolePolicyDocument: {
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: { Service: 'ec2.amazonaws.com' },
        }],
        Version: '2012-10-17',
      },
      ManagedPolicyArns: ['arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore', 'arn:aws:iam::aws:policy/AmazonSSMPatchAssociation'],
      Policies: [{
        PolicyDocument: {
          Statement: [
            {
              Action: [
                'cloudwatch:PutMetricData',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'sns:Publish',
              ],
              Effect: 'Allow',
              Resource: '*',
            },
          ],
          Version: '2012-10-17',
        },
        PolicyName: 'TwingateConnectorInstanceRolePolicy',
      }],
    };
    test('Creates a shared maintenance plan', () => {
      // arrange
      const { stack, vpc } = createStack();

      // act
      new TwingateConnector(stack, 'TwingateConnector', {
        vpc: vpc,
        twingateUrl: 'https://example.twingate.com',
      });

      // assert
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::SSM::Document', {
        Content: {
          description: 'Install packages from Ubuntu repositories',
          mainSteps: [
            {
              action: 'aws:runShellScript',
              inputs: {
                runCommand: [
                  'sudo apt-get update',
                ],
              },
              name: 'updatePackages',
            },
            {
              action: 'aws:runShellScript',
              inputs: {
                runCommand: [
                  'sudo apt-get install -y twingate-connector',
                ],
              },
              name: 'updateTwingate',
            },
            {
              action: 'aws:runShellScript',
              inputs: {
                runCommand: [
                  'sudo systemctl restart twingate-connector',
                ],
              },
              name: 'restartTwingate',
            },
            {
              action: 'aws:runShellScript',
              inputs: {
                runCommand: [
                  'sudo reboot',
                ],
              },
              name: 'reboot',
              precondition: {
                StringEquals: [
                  '{{ reboot }}',
                  'true',
                ],
              },
            },
          ],
          parameters: {
            reboot: {
              allowedValues: [
                'true',
                'false',
              ],
              type: 'String',
            },
          },
          schemaVersion: '2.2',
        },
        DocumentFormat: 'JSON',
        DocumentType: 'Command',
        Name: 'TwingateUpdate',
        TargetType: '/AWS::EC2::Instance',
      });
    });

    test('Creates a shared KMS key', () => {
      // arrange
      const { stack, vpc } = createStack();

      // act
      new TwingateConnector(stack, 'TwingateConnector', {
        vpc: vpc,
        twingateUrl: 'https://example.twingate.com',
      });

      // assert
      const template = Template.fromStack(stack);
      template.hasResource('AWS::KMS::Key', {});
    });

    test('Creates the security group if one has not been provided ', () => {
      // arrange
      const { stack, vpc } = createStack();

      // act
      new TwingateConnector(stack, 'TwingateConnector', {
        vpc: vpc,
        twingateUrl: 'https://example.twingate.com',
      });

      // assert
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow all outbound traffic by default',
            IpProtocol: '-1',
          },
        ],
      });
    });

    test('Creates an instance role if one is not provided', () => {
      // arrange
      const { stack, vpc } = createStack();

      // act
      new TwingateConnector(stack, 'TwingateConnector', {
        vpc: vpc,
        twingateUrl: 'https://example.twingate.com',
      });

      // assert
      const template = Template.fromStack(stack);
      template.hasResourceProperties('AWS::IAM::Role', createdInstanceRoleProperties);
    });

    test('Uses the instance role if provided', () => {
      // arrange
      const { stack, vpc } = createStack();

      // act
      let providedRole = new Role(stack, 'InstanceRole', {
        assumedBy: new AccountPrincipal('123456789012'),

      });
      new TwingateConnector(stack, 'TwingateConnector', {
        vpc: vpc,
        twingateUrl: 'https://example.twingate.com',
        instanceRole: providedRole,
      });

      // assert
      const template = Template.fromStack(stack);

      const foundResources = template.findResources('AWS::IAM::Role', createdInstanceRoleProperties);
      expect(Object.keys(foundResources)).toHaveLength(0);
    });
  });
});
