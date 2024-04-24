import { CfnOutput } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Instance, InstanceType, ISecurityGroup } from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { IRole, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Key } from 'aws-cdk-lib/aws-kms';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { CfnDocument, CfnMaintenanceWindowTask } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { TwingateConnectorShared } from './TwingateConnectorShared';

export interface TwingateConnectorProps {

  /**
   * The VPC to deploy the connector into
   */
  readonly vpc: ec2.IVpc;

  /**
   * The Twingate URL to connect to.
   *
   * @example https://example.twingate.com
   */
  readonly twingateUrl: string;

  /**
   * The number of connectors to deploy
   * @default 2
   */
  readonly connectorCount?: number;

  /**
   * An instance type to use for the ec2 instances.
   *
   * @default InstanceType.of(InstanceClass.BURSTABLE3_AMD, InstanceSize.MICRO)
   */
  readonly instanceType?: InstanceType;

  /**
   * An optional securityGroup which will be attached to the EC2 instance security groups
   *
   * @default - A new security group will be created
   */
  readonly securityGroup? : ISecurityGroup;

  /**
   * An optional instance role to use for the EC2 instances
   *
   * @default - A new role will be created
   */
  readonly instanceRole?: IRole;
}


interface UserDataProps {
  twingateUrl: string;
  secretName: string;
}

export class TwingateConnector extends Construct {
  constructor(scope: Construct, id: string, props: TwingateConnectorProps) {
    super(scope, id);

    // Defaults
    const connectorCount = props.connectorCount ?? 2;

    // Validate
    if (connectorCount < 1) {
      throw new Error('connectorCount should be greater than 0');
    }
    if (/https:\/\//.test(props.twingateUrl) === false) {
      throw new Error('twingateUrl is required, this should be something like `https://example.twingate.com`');
    }

    const vpc = props.vpc;

    const {
      connectorSecurityGroup,
      instanceRole,
      patchDocument,
      twingateEncryptionKey,
    } = new TwingateConnectorShared(this, 'TwingateConnectorSharedConstruct', props);

    for (let i = 0; i < connectorCount; i++) {
      // create the secret to hold the Twingate access token and refresh token
      const secret = new Secret(this, 'TwingateConnectorSecret-' + i, {
        encryptionKey: twingateEncryptionKey,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            twingateAccessToken: '',
          }),
          excludePunctuation: true,
          generateStringKey: 'twingateAccessToken',
        },
      });
      const commandsUserData = this.createCommandsUserData({
        twingateUrl: props.twingateUrl,
        secretName: secret.secretName,
      });
      const connectorInstance = new ec2.Instance(this, 'TwingateConnectorInstance-' + i, {
        vpc: vpc,
        securityGroup: connectorSecurityGroup,
        instanceType: props.instanceType ?? ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3_AMD, ec2.InstanceSize.MICRO),
        machineImage: ec2.MachineImage.lookup({
          name: 'twingate/images/hvm-ssd/twingate-amd64-*',
          owners: ['617935088040'],
        }),
        userData: commandsUserData,
        userDataCausesReplacement: false,
        role: instanceRole,
      });
      secret.grantRead(instanceRole);

      this.createMaintenanceWindow(i.toString(), twingateEncryptionKey, instanceRole, connectorInstance, patchDocument);

      new CfnOutput(this, 'TwingateConnectorSecretNameOutput-' + i, {
        value: secret.secretName,
      });
    }

    new CfnOutput(this, 'TwingateConnectorSecurityGroupNameOutput', {
      value: connectorSecurityGroup.securityGroupId,
    });
  }

  protected createMaintenanceWindow(
    suffix: string,
    twingateEncryptionKey: Key,
    instanceRole: IRole,
    connectorInstance: Instance,
    patchDocument: CfnDocument,
  ) {
    const maintenanceWindowName = 'TwingateMaintenanceWindow-' + suffix;

    const ssmRole = new iam.Role(this, 'SSMRole-' + suffix, {
      assumedBy: new iam.ServicePrincipal('ssm.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(this, 'SsmMangedPolicyArns' + suffix, 'arn:aws:iam::aws:policy/service-role/AmazonSSMMaintenanceWindowRole'),
      ],
      inlinePolicies: {
        TwingatePatchManager: new iam.PolicyDocument({
          statements: [
            new PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['iam:PassRole'],
              resources: ['*'],
              conditions: {
                StringEquals: {
                  'iam:PassedToService': ['ssm.amazonaws.com'],
                },
              },
            }),
            new PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
                'logs:DescribeLogGroups',
              ],
              resources: ['*'],
            }),
            new PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'resource-groups:ListGroupResources',
                'resource-groups:ListGroups',
              ],
              resources: ['*'],
            }),
            new PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'tag:GetResources',
              ],
              resources: ['*'],
            }),
            new PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricData',
                'cloudwatch:GetMetricStatistics',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });
    twingateEncryptionKey.grantEncryptDecrypt(ssmRole);
    twingateEncryptionKey.grantEncryptDecrypt(instanceRole);

    const maintenanceWindow = new ssm.CfnMaintenanceWindow(this, maintenanceWindowName, {
      allowUnassociatedTargets: false,
      name: maintenanceWindowName,
      schedule: `cron(0 0 ${suffix + 3} ? * SAT *)`, // cron(0 0 ${i + 3} ? * FRI *)
      duration: 1, // hours
      cutoff: 0, // Stop initiating new tasks 1 hour before the maintenance window ends
      scheduleTimezone: 'America/New_York',
      description: 'Twingate Connector Maintenance Window',
    });

    new ssm.CfnMaintenanceWindowTarget(this, 'MaintenanceWindowTarget-' + suffix, {
      windowId: maintenanceWindow.ref,
      resourceType: 'INSTANCE',
      targets: [{
        key: 'InstanceIds',
        values: [connectorInstance.instanceId],
      }],
    });

    const cloudWatchOutputConfigProperty: CfnMaintenanceWindowTask.CloudWatchOutputConfigProperty = {
      cloudWatchLogGroupName: 'TwingateConnectorMaintenanceWindow-' + suffix,
      cloudWatchOutputEnabled: true,
    };

    new ssm.CfnMaintenanceWindowTask(this, 'MaintenanceWindowTask-' + suffix, {
      windowId: maintenanceWindow.ref,
      targets: [
        {
          key: 'InstanceIds',
          values: [connectorInstance.instanceId],
        },
      ],
      taskType: 'RUN_COMMAND',
      taskArn: patchDocument.name as string,
      priority: 1,
      maxConcurrency: '2',
      maxErrors: '1',
      serviceRoleArn: ssmRole.roleArn,
      taskInvocationParameters: {
        maintenanceWindowRunCommandParameters: {
          comment: 'Twingate Connector Patching',
          cloudWatchOutputConfig: cloudWatchOutputConfigProperty,
          timeoutSeconds: 600,
          parameters: {
            reboot: ['true'],
          },
          serviceRoleArn: ssmRole.roleArn,
        },
      },
    });
  }

  protected createCommandsUserData(userDataProps: UserDataProps) {
    const userData = this.createUserDataObject(userDataProps);

    const commandsUserData = ec2.UserData.forLinux();
    commandsUserData.addCommands(userData);
    return commandsUserData;
  }

  protected createUserDataObject(props: UserDataProps): string {
    return `
apt update -y
apt install jq unzip -y
cd /tmp
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
sudo mkdir -p /etc/twingate/

### Install Connector
SECRET_ID="${props.secretName}"

TWINGATE_ACCESS_TOKEN=$(aws secretsmanager get-secret-value --secret-id $SECRET_ID --query SecretString --output text | jq -r '.twingateAccessToken')
TWINGATE_REFRESH_TOKEN=$(aws secretsmanager get-secret-value --secret-id $SECRET_ID --query SecretString --output text | jq -r '.twingateRefreshToken')

# Check if TWINGATE_ACCESS_TOKEN or TWINGATE_REFRESH_TOKEN is empty
while [[ "$TWINGATE_ACCESS_TOKEN" == "null" || "$TWINGATE_REFRESH_TOKEN" == "null" ]]; do
  echo "Keep looking up secret until we get the access token and refresh token"
  export TWINGATE_ACCESS_TOKEN=$(aws secretsmanager get-secret-value --secret-id $SECRET_ID --query SecretString --output text | jq -r '.twingateAccessToken')
  export TWINGATE_REFRESH_TOKEN=$(aws secretsmanager get-secret-value --secret-id $SECRET_ID --query SecretString --output text | jq -r '.twingateRefreshToken')
  sleep 30s
done


HOSTNAME_LOOKUP=$(curl http://169.254.169.254/latest/meta-data/local-hostname)
{
echo TWINGATE_URL=${props.twingateUrl}
echo TWINGATE_ACCESS_TOKEN=$(aws secretsmanager get-secret-value --secret-id $SECRET_ID --query SecretString --output text | jq -r '.twingateAccessToken')
echo TWINGATE_REFRESH_TOKEN=$(aws secretsmanager get-secret-value --secret-id $SECRET_ID --query SecretString --output text | jq -r '.twingateRefreshToken')
echo TWINGATE_LABEL_HOSTNAME=$HOSTNAME_LOOKUP
} > /etc/twingate/connector.conf

sudo systemctl enable --now twingate-connector
echo "completed userdata"
`;
  }

}
