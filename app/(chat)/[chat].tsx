import {useEffect, useRef, useState} from "react";
import {Link, Stack, useLocalSearchParams} from "expo-router";
import {ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, TextInput, View,} from "react-native";
import {Text} from "@/components/Text";
import {ChatRoom, Message} from "@/utils/types";
import {appwriteConfig, client, database} from "@/utils/appwrite";
import {ID, Query} from "react-native-appwrite";
import {LegendList} from "@legendapp/list";
import {SafeAreaView} from "react-native-safe-area-context";
import {useHeaderHeight} from "@react-navigation/elements";
import {IconSymbol} from "@/components/IconSymbol";
import {useUser} from "@clerk/clerk-expo";
import {Primary, Secondary} from "@/colors";

export default function ChatRoomScreen() {
    const {chat: chatRoomId} = useLocalSearchParams();
    const {user} = useUser();

    if (!chatRoomId)
        return <Text>We could not find this chat room 🥲</Text>;

    const [messageContent, setMessageContent] = useState("");
    const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const headerHeight = Platform.OS === "ios" ? useHeaderHeight() : 0;
    const textInputRef = useRef<TextInput>(null);

    useEffect(() => {
        handleFirstLoad().catch(error => {
            console.error('Error fetching chats:', error);
        });
    }, []);
    useEffect(() => {
        if (!isLoading) {
            setTimeout(() => {
                textInputRef.current?.focus();
            }, 100);
        }
    }, [isLoading]);
    useEffect(() => {
        const channel = `databases.${appwriteConfig.db}.collections.${appwriteConfig.col.chatRooms}.documents.${chatRoomId}`;

        const unsubscribe = client.subscribe(channel, () => {
            console.log("Chat room updated");
            getMessages().catch(error => {
                console.error('Error fetching messages:', error);
            });
        });

        return () => {
            unsubscribe();
        };
    }, [chatRoomId]);

    async function handleFirstLoad() {
        try {
            await getChatRoom();
            await getMessages();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }

    async function getChatRoom() {
        const document = await database.getDocument(
            appwriteConfig.db,
            appwriteConfig.col.chatRooms,
            chatRoomId as string
        );

        setChatRoom(document as unknown as ChatRoom);
    }

    async function getMessages() {
        try {
            const {documents} = await database.listDocuments(
                appwriteConfig.db,
                appwriteConfig.col.message,
                [
                    Query.equal("chatRoomId", chatRoomId),
                    Query.limit(100),
                    Query.orderDesc("$createdAt"),
                ]
            );

            documents.reverse();

            setMessages(documents as unknown as Message[]);
        } catch (error) {
            console.error(error);
        }
    }

    async function handleSendMessage() {
        if (messageContent.trim() === "") return;

        const message = {
            content: messageContent,
            senderId: user?.id!,
            senderName: user?.fullName ?? "Anonymous",
            senderPhoto: user?.imageUrl ?? "",
            chatRoomId: chatRoomId as string,
        };

        try {
            await database.createDocument(
                appwriteConfig.db,
                appwriteConfig.col.message,
                ID.unique(),
                message
            );
            setMessageContent("");

            console.log("Updating chat room", chatRoomId);
            await database.updateDocument(
                appwriteConfig.db,
                appwriteConfig.col.chatRooms,
                chatRoomId as string,
                {$updatedAt: new Date().toISOString()}
            );
        } catch (error) {
            console.error(error);
        }
    }

    if (isLoading) {
        return (
            <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
                <ActivityIndicator/>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{
                headerTitle: chatRoom?.title, headerRight: () => (
                    <Link
                        href={{
                            pathname: "/settings/[chat]",
                            params: {chat: chatRoomId as string},
                        }}
                    >
                        <IconSymbol name="gearshape" size={24} color={Primary}/>
                    </Link>
                ),
            }}/>
            <SafeAreaView style={{flex: 1}} edges={["bottom"]}>
                <KeyboardAvoidingView style={{flex: 1}} behavior={"padding"} keyboardVerticalOffset={headerHeight}>
                    <LegendList
                        data={messages}
                        renderItem={({item}) => {
                            const isSender = item.senderId === user?.id;
                            return (
                                <View
                                    style={{
                                        padding: 10,
                                        borderRadius: 10,
                                        flexDirection: "row",
                                        alignItems: "flex-end",
                                        gap: 6,
                                        maxWidth: "80%",
                                        alignSelf: isSender ? "flex-end" : "flex-start",
                                    }}
                                >
                                    {!isSender && (
                                        <Image
                                            source={{uri: item.senderPhoto}}
                                            style={{width: 30, height: 30, borderRadius: 15}}
                                        />
                                    )}
                                    <View
                                        style={{
                                            backgroundColor: isSender ? "#007AFF" : "#161616",
                                            flex: 1,
                                            padding: 10,
                                            borderRadius: 10,
                                        }}
                                    >
                                        <Text style={{fontWeight: "500", marginBottom: 4}}>
                                            {item.senderName}
                                        </Text>
                                        <Text>{item.content}</Text>
                                        <Text
                                            style={{
                                                fontSize: 10,
                                                textAlign: "right",
                                            }}
                                        >
                                            {new Date(item.$createdAt!).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }}
                        keyExtractor={(item) => item?.$id ?? "unknown"}
                        maintainVisibleContentPosition={true}
                        contentContainerStyle={{padding: 10}}
                        recycleItems={true}
                        initialScrollIndex={messages.length - 1}
                        alignItemsAtEnd={true}
                        maintainScrollAtEnd
                        maintainScrollAtEndThreshold={0.5}
                        estimatedItemSize={100}
                    />
                    <View style={{
                        borderWidth: 1,
                        borderColor: Secondary,
                        flexDirection: "row",
                        alignItems: "center",
                        borderRadius: 20,
                        marginBottom: 6,
                        marginHorizontal: 10,
                    }}>
                        <TextInput ref={textInputRef} placeholder="Type a message" style={{
                            minHeight: 40,
                            color: "white",
                            flexShrink: 1,
                            flexGrow: 1,
                            padding: 10,
                        }}
                                   placeholderTextColor={"gray"}
                                   multiline
                                   value={messageContent}
                                   onChangeText={setMessageContent}
                        />
                        <Pressable style={{
                            width: 50,
                            height: 50,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                                   onPress={handleSendMessage}
                        >
                            <IconSymbol name="paperplane" size={24} color={messageContent ? Primary : "gray"}/>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}
