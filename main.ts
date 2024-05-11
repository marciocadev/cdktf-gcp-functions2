import { Construct } from "constructs";
import { App, TerraformStack } from "cdktf";
import { DataArchiveFile } from "@cdktf/provider-archive/lib/data-archive-file";
import { resolve } from "path";
import { ArchiveProvider } from "@cdktf/provider-archive/lib/provider";
import { GoogleProvider } from "@cdktf/provider-google/lib/provider";
import { StorageBucket } from "@cdktf/provider-google/lib/storage-bucket";
import { StorageBucketObject } from "@cdktf/provider-google/lib/storage-bucket-object";
import { Cloudfunctions2Function } from "@cdktf/provider-google/lib/cloudfunctions2-function";
import { CloudRunServiceIamMember } from "@cdktf/provider-google/lib/cloud-run-service-iam-member";

class MyStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    new GoogleProvider(this, "gcp", {
      region: "us-east1",
      project: "master-balm-420315",
    })

    new ArchiveProvider(this, "archive")

    const lambdaFile = new DataArchiveFile(this, "lambdaFile", {
      outputPath: "function.zip",
      sourceDir: resolve(__dirname, "./src"),
      // sourceFile: "index.js",
      type: "zip"
    })

    const storageBucket = new StorageBucket(this, "storageBucket", {
      name: "function-v2-bucket",
      location: "us-east1",
      uniformBucketLevelAccess: true,
      forceDestroy: true
    })

    const storageBucketObject = new StorageBucketObject(this, "storageBucketObject", {
      bucket: storageBucket.name,
      name: "function.zip",
      source: lambdaFile.outputPath,
    })

    const fun = new Cloudfunctions2Function(this, "function", {
      location: "us-east1",
      name: "function-v2-example",
      description: "function second generation example with CDKTF",
      buildConfig: {
        runtime: "nodejs20",
        entryPoint: "helloHttp",
        source: {
          storageSource: {
            bucket: storageBucket.name,
            object: storageBucketObject.name
          },
        }
      },
      serviceConfig: {
        minInstanceCount: 1,
        maxInstanceCount: 10,
        availableMemory: "256M",
        timeoutSeconds: 60,
        allTrafficOnLatestRevision: true
      }
    })

    new CloudRunServiceIamMember(this, "member", {
      member: "allUsers",
      role: "roles/run.invoker",
      service: fun.name,
      location: fun.location,
    })
  }
}

const app = new App();
new MyStack(app, "cdktf-gcp-functions2");
app.synth();
