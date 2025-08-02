import {Slot} from "expo-router";
import {ClerkProvider} from "@clerk/clerk-expo";
import {passkeys} from "@clerk/expo-passkeys";
import {tokenCache} from "@/utils/cache";

export default function RootLayout() {
    const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

    if (!publishableKey)
        throw new Error("Missing Clerk Publishable Key");

    return (
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} __experimental_passkeys={passkeys}>
            <Slot/>
        </ClerkProvider>
    );
}
