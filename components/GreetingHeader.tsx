import React, { useMemo } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

const greetings = {
    morning: [
        "Today's forecast: 100% chance of music",
        "Rise and shine",
        "Wake up and smell the day 😂",
        "Now playing: your day.",
        "Good morning... at least, that's what the clock claims 🕰️",
        "Morning! Time to pretend we're functioning adults",
        "It's morning, let's make some noise",
        "Good morning! Time to get your groove on",
        "Good morning! (or whatever time your brain thinks it is)",
        "It's morning, so stop yawning!",
        "A morning without music is a warning!",
        "Good morning! Time to get your groove on", 
        "Morning! Time to pretend we're functioning adults 🥸",
        "My bed and I love each other, but my alarm clock is jealous ⏰",
        "Good morning! OR is it??? **checks pulse**",
    ], 
    afternoon: [
        "Warning: may cause spontaneous dancing",
        "Afternoon, Time for a new soundtrack 🎶",
        "I'm not a morning person, I'm an afternoon... psych!! 😂",
        "Afternoon motivation",
        "We keep grinding, we keep rocking!!",
        "Afternoon delight, you're shining bright!",
        "It's the afternoon, play a tune!",
        "Late afternoon, time to swoon!",
        "Afternoon! Time to get your groove on 🎶",
        "I'm officially running on caffeine, chaos, and good music 🎶",
        "Currently experiencing life at 15 frames per second 🐌",
        "Afternoon! Productivity levels are plummeting, turn up the volume! 🎚️",
        "If every day is a gift, I'd like a receipt for this afternoon 🧾",
    ], 
    evening: [
        "It's evening, time to press play",
        "Evening vibes",
        "Evening motivation",
        "I'm not a night owl, I'm just someone who enjoys the quiet hours 🦉",
        "Night: when the world is asleep, we're awake 🌙",
        "Evening time, feeling prime!",
        "Good evening, what's its meaning?",
        "Sun is leaving, good evening!",
        "Why did the musician get arrested? He was in treble 😂",
        "Time to aggressively relax 🛋️",
        "The time of day when you realize you've accomplished nothing 🏆",
        "I'm not a night owl, I'm just an exhausted pigeon 🐦",
        "Finally dark outside so I can stop feeling bad about staying inside 🌙",
    ],
};

const getGreeting = () => {
    const hour = new Date().getHours();
    let timeOfDay: keyof typeof greetings;
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';

    const categoryGreetings = greetings[timeOfDay];
    const randomIndex = Math.floor(Math.random() * categoryGreetings.length);
    return categoryGreetings[randomIndex];
};

interface GreetingHeaderProps {
    style?: TextStyle;
}

export const GreetingHeader = React.memo(({ style }: GreetingHeaderProps) => {
    // Memoize the greeting so it doesn't change on every re-render of the parent
    const greeting = useMemo(() => getGreeting(), []);
    
    return (
        <Text style={[styles.headerTitle, style]}>{greeting}</Text>
    );
});

const styles = StyleSheet.create({
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
    },
});
