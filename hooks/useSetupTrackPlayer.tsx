import { setupPlayer } from "@/services/TrackPlayerService";
import { useEffect, useRef } from "react";

export const useSetupTrackPlayer = ({ onLoad }: { onLoad?: () => void }) => {
  const isInitialized = useRef(false);

  useEffect(() => {
    setupPlayer()
      .then(() => {
        isInitialized.current = true;
        onLoad?.();
      })
      .catch((error) => {
        isInitialized.current = false;
        console.error(error);
      });
  }, [onLoad]);
};
