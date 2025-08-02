import {SafeAreaView, View} from "react-native";
import {Text} from "@/components/Text";
import {Image} from "expo-image";

export default function Index() {
    return (
        <SafeAreaView style={{flex: 1}}>
            <View style={{gap: 20, alignItems: "center"}}>
                <Image source={require("@/assets/images/authlogo.png")} style={{width: 100, height: 100}}/>
                <Text style={{fontSize: 32, fontWeight: "bold"}}>Modern Chat App!</Text>
                <Text>The best chat app in the world!</Text>
            </View>

        </SafeAreaView>
    );
}
