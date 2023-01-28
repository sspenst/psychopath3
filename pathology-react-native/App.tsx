import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Button, Dimensions, Platform, SafeAreaView } from 'react-native';
import WebView from 'react-native-webview';
import AchievementInfo from '../constants/achievementInfo';
import NotificationType from '../constants/notificationType';
import { EnrichedLevel } from '../models/db/level';
import Notification from '../models/db/notification';
import notifee from '@notifee/react-native';

import User from '../models/db/user';

// TODO:
// last_visited_at should not update in withAuth for BACKGROUND_FETCH_TASK
// notification icons (can we use level/pfp images for notifications or do we have to use the app logo?)
// push notification settings (turn notifications off/on)
// test android

export async function getNotificationString(username: string, notification: Notification) {
  const targetLevel = notification.target as EnrichedLevel;
  const targetUser = notification.target as User;
  
  switch (notification.type) {
  case NotificationType.NEW_ACHIEVEMENT: {
    if (notification.source) {
      const achievement = notification.source;

      return [`Achievement unlocked! ${AchievementInfo[achievement.type].description}`, 'https://pathology.gg/profile/' + username + '/achievements', undefined];
    }

    return ['Unknown achievement', 'https://pathology.gg/profile/' + username + '/achievements', undefined];
  }
  case NotificationType.NEW_FOLLOWER:{
    const avatar = "/api/avatar/"+notification.source._id+".png"
    return [notification.source.name + ' started following you', 'https://pathology.gg/profile/' + notification.source.name, avatar];
  }
  case NotificationType.NEW_LEVEL: {
    const levelImage = "/api/level/image/"+targetLevel._id+".png"
    return [notification.source.name + ` published a new level: ${targetLevel.name}`, `https://pathology.gg/level/${targetLevel.slug}`, levelImage];
  }
  case NotificationType.NEW_RECORD_ON_A_LEVEL_YOU_BEAT: {
    const levelImage = "/api/level/image/"+targetLevel._id+".png"
    return [notification.source.name + ` set a new record: ${targetLevel.name} - ${(notification.message)} moves', 'https://pathology.gg/level/${targetLevel.slug}`,levelImage];
  }
  case NotificationType.NEW_REVIEW_ON_YOUR_LEVEL: {
    const levelImage = "/api/level/image/"+targetLevel._id+".png"
    return [notification.source.name + ` wrote a ${isNaN(Number(notification.message)) ? notification.message : Number(notification.message) > 0 ? `${Number(notification.message)} stars` : undefined} review on your level ${targetLevel.name}`, `https://pathology.gg/level/${targetLevel.slug}`,levelImage];
  }
  case NotificationType.NEW_WALL_POST: {
    const avatar = "/api/avatar/"+notification.source._id+".png"
    const comment = notification.message ? JSON.parse(notification.message) : null;

    const shortenedText = comment ? (comment.text.length > 10 ? comment.text.substring(0, 10) + '...' : comment.text) : '';

    return [notification.source.name + ` posted "${shortenedText}" on your profile.`, `https://pathology.gg/profile/${username}`, avatar];
  }

  case NotificationType.NEW_WALL_REPLY: {
    const avatar = "/api/avatar/"+notification.source._id+".png"
    const comment = notification.message ? JSON.parse(notification.message) : null;

    const shortenedText = comment ? (comment.text.length > 10 ? comment.text.substring(0, 10) + '...' : comment.text) : '';

    return [notification.source.name + ` replied "${shortenedText}" to your message on ${targetUser.name}'s profile.`, `https://pathology.gg/profile/${targetUser.name}`, avatar];
  }

  default:
    return ['Unknown', 'https://pathology.gg/notifications', undefined];
  }
}

const BACKGROUND_FETCH_TASK = 'background-fetch';
let lastNotificationTimestamp = 0;

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  // make a network request to https://pathology.gg/api/user

  // temp
  lastNotificationTimestamp = 0
  console.log('fetching with lastNotificationTimestamp as ', lastNotificationTimestamp)  
  const response = await fetch(`https://pathology.gg/api/notification?read=false&min_timestamp=${lastNotificationTimestamp}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }

  const data = await response.json();

  if (!data) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }

  // check if data.notifications exists and is array
  if (!data.notifications || !Array.isArray(data.notifications)) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
  
  const notifications = data.notifications as Notification[];
  const unreadNotifications = notifications.filter(n => !n.read);

  if (unreadNotifications.length === 0) {
    return BackgroundFetch.BackgroundFetchResult.NoData;
  }

  // if only one notification then write out more explicitly what the notif is
  let body = 'You have ' + unreadNotifications.length + ' unread notifications';
  let url = 'https://pathology.gg/notifications?filter=unread';
  let img;
  const latestUnreadTs = new Date(unreadNotifications[0].createdAt).getTime();

  lastNotificationTimestamp = Math.max(latestUnreadTs, lastNotificationTimestamp);
  
  let imageUrl = undefined;
  if (unreadNotifications.length === 1) {
    [body, url, img] = await getNotificationString(data.name, unreadNotifications[0]);
    if (img) {
      imageUrl ="https://pathology.gg"+img;
    }
  }
  console.log('lastNotificationTimestamp updated to ', lastNotificationTimestamp, imageUrl)  
  // create a notification, link to pathology.gg/notifications
  await notifee.displayNotification({
    
      title: 'Pathology',
      body: body,
      data: { url: url },
      ios: {
      // don't include if imageUrl is undefined
      ...(imageUrl && { attachments: [{ url: imageUrl }] }),
      
    }
  });

  // Be sure to return the successful result type!
  return BackgroundFetch.BackgroundFetchResult.NewData;
});

// 2. Register the task at some point in your app by providing the same name,
// and some configuration options for how the background fetch should behave
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 1, // 15 minutes
    stopOnTerminate: false, // android only,
    startOnBoot: true, // android only
  });
}

// 3. (Optional) Unregister tasks by specifying the task name
// This will cancel any future background fetch calls that match the given name
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
async function unregisterBackgroundFetchAsync() {
  return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
}

export default function BackgroundFetchScreen() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [status, setStatus] = useState<BackgroundFetch.BackgroundFetchStatus | null>(null);

  useEffect(() => {
    checkStatusAsync();
    registerBackgroundFetchAsync();
  }, []);

  const checkStatusAsync = async () => {
    // request permissions for notifications
    await Notifications.requestPermissionsAsync();
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);

    setStatus(status);
    setIsRegistered(isRegistered);
  };

  const toggleFetchTask = async () => {
    if (isRegistered) {
      await unregisterBackgroundFetchAsync();
    } else {
      await registerBackgroundFetchAsync();
    }

    checkStatusAsync();
  };
  /*
  return (
    <View style={styles.screen}>
      <View style={styles.textContainer}>
        <Text>
          Background fetch status:{' '}
          <Text style={styles.boldText}>
            {status && BackgroundFetch.BackgroundFetchStatus[status]}
          </Text>
        </Text>
        <Text>
          Background fetch task name:{' '}
          <Text style={styles.boldText}>
            {isRegistered ? BACKGROUND_FETCH_TASK : 'Not registered yet!'}
          </Text>
        </Text>
      </View>
      <View style={styles.textContainer}></View>
      <Button
        title={isRegistered ? 'Unregister BackgroundFetch task' : 'Register BackgroundFetch task'}
        onPress={toggleFetchTask}
      />
    </View>
  );*/

  const webViewRef = useRef<any>();
  const [loading, setLoading] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('https://pathology.gg?platform=' + Platform.OS);
  const goBack = () => {
    if (webViewRef.current) {
      webViewRef.current.goBack();
    }
  };
  const onAndroidBackPress = () => {
    if (webViewRef.current) {
      webViewRef.current.goBack();

      return true; // prevent default behavior (exit app)
    }

    return false;
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', onAndroidBackPress);

      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onAndroidBackPress);
      };
    }
  }, []);
  const responseListener = useRef<any>();

  useEffect(() => {
    console.log("Registering background event")
    notifee.onForegroundEvent(async (event) => {
      const {type } = event;
      console.log("Type ", type)
      const { data, id } = event.detail.notification;
      await notifee.cancelNotification(id);
      console.log("in background, data is ", data, "id is ", id)
      if (!data) return;

      const { url } = data;
      console.log("onBackgroundEvent", url, webViewUrl)
      if (url) {
        setWebViewUrl( (url as string)+"?"+Date.now() );
      }
    
    });
    notifee.onBackgroundEvent = notifee.onForegroundEvent;
    
    return () => {
      console.log("unregistering background event")
      notifee.onForegroundEvent(null);
      notifee.onBackgroundEvent = notifee.onForegroundEvent;
    }
  }, []);

  const SCREEN_WIDTH = Dimensions.get('window').width;
  const SCREEN_HEIGHT = Dimensions.get('window').height;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <WebView
        originWhitelist={['*']}
        ref={webViewRef}
        style={{

        }}
        containerStyle={{ backgroundColor: 'black' }}

        sharedCookiesEnabled={true}
        allowUniversalAccessFromFileURLs={true}
        allowFileAccessFromFileURLs={true}
        allowFileAccess={true}
        allowsInlineMediaPlayback={true}
        allowsFullscreenVideo={ false }
        renderLoading={() => <ActivityIndicator size="large" color="red" />}

        onLoadProgress={({ nativeEvent }) => {
          if (nativeEvent.progress !== 1) {
            setLoading(true);
          } else if (nativeEvent.progress === 1 ) {
            setLoading(false);
          }
        }}

        startInLoadingState={true}

        javaScriptEnabled={true}
        domStorageEnabled={true}
        pullToRefreshEnabled={true}

        allowsBackForwardNavigationGestures={true}
        onContentProcessDidTerminate={() => webViewRef.current.reload()}
        mediaPlaybackRequiresUserAction={true}

        source={{ uri: webViewUrl }}
      />

      <Button color={'white'} title={'Back'} onPress={goBack}
      />

      {loading &&
      <ActivityIndicator
        style={{ position: 'absolute', top: SCREEN_HEIGHT / 2, left: SCREEN_WIDTH / 2,
          zIndex: 9999,
          transform: [{ translateX: -25 }, { translateY: -25 }]
        }}
        size="large"
      />
      }

    </SafeAreaView>

  );
}
