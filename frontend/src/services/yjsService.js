import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

export const createYjsConnection = (documentId) => {

    const ydoc = new Y.Doc();

    const provider = new WebsocketProvider(
        "ws://localhost:5000",
        `syncdoc-${documentId}`,
        ydoc
    );

    const blocks = ydoc.getMap("blocks");

    return {
        ydoc,
        provider,
        blocks
    };
};