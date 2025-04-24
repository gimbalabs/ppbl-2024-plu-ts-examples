import { BlockfrostPluts } from "@harmoniclabs/blockfrost-pluts";

function blockfrost () {
    const provider = new BlockfrostPluts({
        projectId: "preprodOM8Rk2UZLfqFYRpDuCOlVKQ344DcGZIg"
    });
    return provider;
}

export default blockfrost;