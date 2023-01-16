const fs = require("fs");

parse();
async function parse() {
    const IN_FILE = "./gen-results-long.txt";
    const OUT_FILE = "./gen-results-long-parsed.json";

    const chromosomes: any[] = [];

    const contents = await fs.promises.readFile(IN_FILE, "utf-8");
    for (let line of contents.split("\n")) {
        line = line.trim().replace(/\0/g, '');
        if (line[0] !== "{") {
            continue;
        }
        console.log(line);

        let lineChomosome: string;
        try {
            lineChomosome = JSON.parse(line);
            console.log(line);
        } catch (err) {
            continue;
        }
        chromosomes.push(lineChomosome);
    }

    chromosomes.sort((a, b) => b.numGames - a.numGames);

    await fs.promises.writeFile(OUT_FILE, JSON.stringify(chromosomes, null, 4));
}
