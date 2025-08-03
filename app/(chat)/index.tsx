import {useEffect, useState} from "react";
import {FlatList, RefreshControl, View} from "react-native";
import {Text} from "@/components/Text";
import {Link} from "expo-router";
import {IconSymbol} from "@/components/IconSymbol";
import {appwriteConfig, client, database} from "@/utils/appwrite";
import {ChatRoom} from "@/utils/types";
import {Query} from "react-native-appwrite";

interface AppwriteChatRoomDocument {
    $id: string;
    title: string;
    description: string;
    isPrivate: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function Index() {
    const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchChatRooms().catch(error => {
            console.error('Error fetching chat rooms:', error);
        });

        const unsubscribe = client.subscribe(`databases.${appwriteConfig.db}.collections.${appwriteConfig.col.chatRooms}.documents`, (response) => {
                const payload = response.payload as AppwriteChatRoomDocument;

                if (response.events.includes('databases.*.collections.*.documents.*.create')) {
                    const newRoom: ChatRoom = {
                        id: payload.$id,
                        title: payload.title,
                        description: payload.description,
                        isPrivate: payload.isPrivate,
                        createdAt: new Date(payload.createdAt),
                        updatedAt: new Date(payload.updatedAt),
                    };

                    setChatRooms(prevRooms => [newRoom, ...prevRooms]);
                }

                if (response.events.includes('databases.*.collections.*.documents.*.update')) {
                    const updatedRoom: ChatRoom = {
                        id: payload.$id,
                        title: payload.title,
                        description: payload.description,
                        isPrivate: payload.isPrivate,
                        createdAt: new Date(payload.createdAt),
                        updatedAt: new Date(payload.updatedAt),
                    };

                    setChatRooms(prevRooms =>
                        prevRooms.map(room =>
                            room.id === updatedRoom.id ? updatedRoom : room
                        )
                    );
                }

                if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
                    const deletedRoomId = payload.$id;
                    setChatRooms(prevRooms =>
                        prevRooms.filter(room => room.id !== deletedRoomId)
                    );
                }
            }
        );

        return () => {
            unsubscribe();
        };
    }, []);

    const handleRefresh = async () => {
        try {
            setIsRefreshing(true);
            await fetchChatRooms();
        } catch (error) {
            console.error(error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const fetchChatRooms = async () => {
        try {
            const {documents} = await database.listDocuments(
                appwriteConfig.db,
                appwriteConfig.col.chatRooms,
                [Query.limit(100), Query.orderDesc('$createdAt')]
            );

            const rooms = documents.map((doc) => ({
                id: doc.$id,
                title: doc.title,
                description: doc.description,
                isPrivate: doc.isPrivate,
                createdAt: new Date(doc.createdAt),
                updatedAt: new Date(doc.updatedAt),
            }));

            setChatRooms(rooms);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <FlatList
            data={chatRooms}
            keyExtractor={(item) => item.id}
            refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh}/>
            }
            renderItem={({item}) => {
                return (
                    <Link href={{pathname: "/[chat]", params: {chat: item.id},}}>
                        <View style={{
                            gap: 6,
                            padding: 16,
                            width: "100%",
                            borderRadius: 16,
                            alignItems: "center",
                            flexDirection: "row",
                            backgroundColor: "#262626",
                            justifyContent: "space-between",
                        }}
                        >
                            <ItemTitleAndDescription
                                title={item.title}
                                description={item.description}
                                isPrivate={item.isPrivate}
                            />
                            <IconSymbol name="chevron.right" size={20} color="#666666"/>
                        </View>
                    </Link>
                );
            }}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{
                padding: 16,
                gap: 16,
            }}
        />
    );
}

function ItemTitle({
                       title,
                       isPrivate,
                   }: {
    title: string;
    isPrivate: boolean;
}) {
    return (
        <View style={{flexDirection: "row", alignItems: "center", gap: 4}}>
            <Text style={{fontSize: 17}}>{title}</Text>
            {isPrivate && <IconSymbol name="lock.fill" size={20} color="#666666"/>}
        </View>
    );
}

function ItemTitleAndDescription({
                                     title,
                                     description,
                                     isPrivate,
                                 }: {
    title: string;
    description: string;
    isPrivate: boolean;
}) {
    return (
        <View style={{gap: 4}}>
            <ItemTitle title={title} isPrivate={isPrivate}/>
            <Text style={{fontSize: 13, color: "#666666"}}>{description}</Text>
        </View>
    );
}
