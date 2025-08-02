import * as SecureStore from "expo-secure-store";
import {TokenCache} from "@clerk/clerk-expo";
import {Platform} from "react-native";


const createTokenCache = (): TokenCache => {
    return {
        getToken: async (key: string) => {
            try {
                const item = await SecureStore.getItemAsync(key);
                if (item) {
                    console.log(`${key} retrieved from cache \n`);
                } else {
                    console.log(`${key} not found in cache \n`);
                }
                return item;
            } catch (error) {
                console.error("Error retrieving token from cache:", error);
                await SecureStore.deleteItemAsync(key);
                return null;
            }
        },
        saveToken: (key: string, token: string) => {
            return SecureStore.setItemAsync(key, token);
        },
    };
};


export const tokenCache = Platform.OS !== "web" ? createTokenCache() : undefined;
