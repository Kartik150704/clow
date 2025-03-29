import { useEffect, useState } from "react"
import { FetchIncompleteRides } from "./api/ride"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { SafeAreaView } from "react-native-safe-area-context"
import { Text, View } from "react-native"
import PlaceSearchScreen from "./screens/SearchScreen"
// import SearchDriverScreen from "./screens/CreatedScreen"
import useSimpleNotifications from "../../Notification/appNotification"

import LoadingComponent from "./screens/LoadingScreen"

import SearchDriverScreen from "./screens/CreatedScreen"
import RideDetailsScreen from "./screens/StartedRide"
const MainScreen = () => {
    const [activeRide, setActiveRide] = useState("initial")
    const {
        notificationContent,
        loading,
        error,
        clearNotification,
        userId
    } = useSimpleNotifications();
    useEffect(() => {
        FetchIncompleteRide();
    }, [notificationContent])
    const FetchIncompleteRide = async () => {
        let id = await AsyncStorage.getItem('id')
        console.log(id)
        let response = await FetchIncompleteRides(id)
        console.log(response);
        if (response.length != 0) {
            setActiveRide(response[0])
        }
        else
        {
            setActiveRide(null)
        }
    }
    useEffect(() => {
        FetchIncompleteRide()
    }, [])

    return (

        <>
            {activeRide && activeRide.status == "created" && <SearchDriverScreen ride={activeRide} />}
            {activeRide && activeRide.status == "started" && <RideDetailsScreen ride={activeRide} />}
            {activeRide == null && <PlaceSearchScreen fetchRide={FetchIncompleteRide} />}
            {activeRide == "initial" && <LoadingComponent />}

        </>



    )
}

export default MainScreen