import { execSync } from "child_process";
import * as fs from "fs";
import path from "path";

const __dirname = path.resolve();

let args = process.argv;
args.splice(0, 2);

const command = args[0].toLowerCase().trim();
let exitCode;
switch (command) {
    case "build":
        exitCode = build();
        break;
    case "test":
        exitCode = test();
        break;
    case "publish":
        exitCode = publish();
        break;
    default:
        console.error(`Unknown command ${command}`);
        exitCode = 1;
        break;
}
process.exit(exitCode);

function build() {
    const testResponse = test();
    if (testResponse !== 0) {
        //throw new Error(`Build failed because test execution failed!`);
        console.log(`...test execution failed!`)
    }

    console.log(`Building...`);

    let opts;
    opts = {
        cwd: `${__dirname}`,
        stdio: [0, 1, 2],
    };

    opts = {
        cwd: `${__dirname}`,
        stdio: [0, 1, 2],
    };
    try {
        execSync(`tsc`, opts);
    } catch (err) {
        console.log("ec", exitCode);
        console.error(`Error building project, check output above!`);
        return 1;
    }
    opts = {
        cwd: __dirname,
        stdio: [0, 1, 2],
    };
    console.log(`Updating package.json version and copying package.json.`);
    try {
        const jsonFile = `${__dirname}\\package.json`;
        let packageJsonStr = fs.readFileSync(jsonFile, {
            encoding: "utf-8",
        });
        const packageJson = JSON.parse(packageJsonStr);
        const version = (packageJson.version || "1.0.0").split(".");
        version[2] = parseInt(version[2]) + 1;
        packageJson.version = version.join(".");
        console.log(`New package.json version is ${packageJson.version}.`);
        packageJsonStr = JSON.stringify(packageJson, null, 4);
        fs.writeFileSync(jsonFile, packageJsonStr);

        execSync(`node node_modules/cpy-cli/cli.js package.json dist`, opts);
        execSync(`node node_modules/cpy-cli/cli.js readme.md dist`, opts);
    } catch (err) {
        console.error(`Error copying package.json / readme.md!`, err);
        return 1;
    }
    return 0;
}

function test() {
    console.log(`Testing...`);
    let opts;
    opts = {
        cwd: `${__dirname}`,
        stdio: [0, 1, 2],
    };
    try {
        execSync(`npm run test:coverage`, opts);
    } catch (err) {
        console.error(`Error running tests, check output above!`);
        return 1;
    }
    return 0;
}

function publish() {
    console.log(`Publishing...`);
    const buildCode = build();
    if (buildCode !== 0) {
        return buildCode;
    }
    let opts;
    opts = {
        cwd: `${__dirname}\\dist`,
        stdio: [0, 1, 2],
    };

    try {
        execSync(`npm publish --access public`, opts);
    } catch (err) {
        console.error(`Error publishing, check output above!`);
        return 1;
    }
    return 0;
}