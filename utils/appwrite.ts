import {Client, Databases} from "react-native-appwrite";

if (!process.env.EXPO_PUBLIC_APPWRITE_APP_ID) {
    throw new Error("EXPO_PUBLIC_APPWRITE_APP_ID is not set");
}

const appwriteConfig = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_APP_ID!,
    platform: "com.anonymous.chatapp",
    db: "688f2e880014f92bf4be",
    col: {
        chatRooms: "688f2ec400339aec1e0a",
        message: "688f2ea5003abe4df5ed"
    },
};

const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform);

const database = new Databases(client);
export {database, appwriteConfig, client};
