import { RemovalPolicy } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Effect, IRole, ManagedPolicy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { CfnDocument } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';


export interface TwingateConnectorSharedProps {
  vpc?: IVpc;
  instanceRole?: IRole;
  twingateSecurityGroup?: ISecurityGroup;
}

export class TwingateConnectorShared extends Construct {
  twingateEncryptionKey: Key;
  patchDocument: CfnDocument;
  connectorSecurityGroup: ISecurityGroup;
  instanceRole: IRole;

  constructor(scope: Construct, id: string, props: TwingateConnectorSharedProps) {
    super(scope, id);

    this.twingateEncryptionKey = new Key(this, 'TwingateEncryptionKey', {
      removalPolicy: RemovalPolicy.DESTROY,
    });
    this.patchDocument = this.createPatchDocument();

    if (!props.twingateSecurityGroup && !props.vpc) {
      throw new Error('You must provide either a twingateSecurityGroup or a VPC for one to be created in');
    }
    this.connectorSecurityGroup = props.twingateSecurityGroup ?? new SecurityGroup(this, 'ConnectorSecurityGroup', {
      vpc: props.vpc!,
      allowAllOutbound: true,
    });
    this.instanceRole = props.instanceRole ?? new iam.Role(
      this, 'TwingateConnectorInstanceRole', {
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        managedPolicies: [
          ManagedPolicy.fromManagedPolicyArn(this, 'ManagedPolicyCore', 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'),
          ManagedPolicy.fromManagedPolicyArn(this, 'ManagedPolicyPatch', 'arn:aws:iam::aws:policy/AmazonSSMPatchAssociation'),
        ],
        inlinePolicies: {
          TwingateConnectorInstanceRolePolicy: new iam.PolicyDocument({
            statements: [
              new PolicyStatement({
                actions: [
                  'cloudwatch:PutMetricData',
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'sns:Publish',
                ],
                effect: Effect.ALLOW,
                resources: ['*'],
              }),
            ],
          }),
        },
      });

  }

  private createPatchDocument() {
    return new ssm.CfnDocument(this, 'PatchDocument', {
      name: 'TwingateUpdate',
      documentType: 'Command',
      content: {
        schemaVersion: '2.2',
        description: 'Install packages from Ubuntu repositories',
        parameters: {
          reboot: {
            type: 'String',
            allowedValues: [
              'true',
              'false',
            ],
          },
        },
        mainSteps: [
          {
            action: 'aws:runShellScript',
            name: 'updatePackages',
            inputs: {
              runCommand: [
                'sudo apt-get update',
              ],
            },
          },
          {
            action: 'aws:runShellScript',
            name: 'updateTwingate',
            inputs: {
              runCommand: [
                'sudo apt-get install -y twingate-connector',
              ],
            },
          },
          {
            action: 'aws:runShellScript',
            name: 'restartTwingate',
            inputs: {
              runCommand: [
                'sudo systemctl restart twingate-connector',
              ],
            },
          },
          {
            action: 'aws:runShellScript',
            name: 'reboot',
            precondition: {
              StringEquals: [
                '{{ reboot }}',
                'true',
              ],
            },
            inputs: {
              runCommand: [
                'sudo reboot',
              ],
            },
          },
        ],
      },
      documentFormat: 'JSON',
      targetType: '/AWS::EC2::Instance',
    });

  }
}
