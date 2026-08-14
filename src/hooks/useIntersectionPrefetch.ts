import { useEffect, useRef, useState } from "react";

interface UseIntersectionPrefetchOptions {
  /** Array of asset URLs (images, scripts, etc.) to prefetch */
  urls: string[];
  /** Optional IntersectionObserver configuration */
  observerOptions?: IntersectionObserverInit;
  /** Callback fired when a specific URL finishes prefetching */
  onPrefetched?: (url: string) => void;
  /** Fired when all listed URLs have been successfully cached */
  onAllPrefetched?: () => void;
  /** Turn off observing or prefetching on-demand */
  disabled?: boolean;
}

/**
 * Custom React hook that monitors a DOM element's visibility.
 * When the element enters the viewport, it triggers non-blocking prefetching of critical
 * assets (images, stylesheets, or media) into the browser cache, minimizing main thread block.
 */
export function useIntersectionPrefetch<T extends HTMLElement = HTMLDivElement>({
  urls,
  observerOptions = { rootMargin: "200px", threshold: 0.01 }, // Trigger 200px before entry for smooth load
  onPrefetched,
  onAllPrefetched,
  disabled = false,
}: UseIntersectionPrefetchOptions) {
  const elementRef = useRef<T | null>(null);
  const [prefetchedUrls, setPrefetchedUrls] = useState<Set<string>>(new Set());
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (disabled || urls.length === 0 || hasCompleted) return;

    const element = elementRef.current;
    if (!element) return;

    const handlePrefetch = async () => {
      setIsPrefetching(true);
      const newlyPrefetched = new Set(prefetchedUrls);

      const promises = urls.map((url) => {
        if (newlyPrefetched.has(url)) return Promise.resolve();

        return new Promise<void>((resolve) => {
          // Detect asset type based on file extension
          const isImage = /\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(url);

          if (isImage) {
            // High-fidelity image prefetching via background instantiation
            const img = new Image();
            img.onload = () => {
              newlyPrefetched.add(url);
              setPrefetchedUrls(new Set(newlyPrefetched));
              if (onPrefetched) onPrefetched(url);
              resolve();
            };
            img.onerror = () => {
              // Fail silently to prevent crashing the main thread
              resolve();
            };
            img.src = url;
          } else {
            // General assets prefetching via DOM rel="prefetch" hint injection
            try {
              const linkId = `prefetch-${window.btoa(url).replace(/=/g, "")}`;
              if (!document.getElementById(linkId)) {
                const link = document.createElement("link");
                link.id = linkId;
                link.rel = "prefetch";
                link.href = url;
                link.onload = () => {
                  newlyPrefetched.add(url);
                  setPrefetchedUrls(new Set(newlyPrefetched));
                  if (onPrefetched) onPrefetched(url);
                  resolve();
                };
                link.onerror = () => resolve();
                document.head.appendChild(link);
              } else {
                resolve();
              }
            } catch (err) {
              resolve();
            }
          }
        });
      });

      await Promise.all(promises);
      setIsPrefetching(false);
      setHasCompleted(true);
      if (onAllPrefetched) onAllPrefetched();
    };

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry && entry.isIntersecting) {
        handlePrefetch();
        // Disconnect immediately after prefetch triggers to save main thread CPU cycles
        observer.unobserve(element);
      }
    }, observerOptions);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [urls, observerOptions, disabled, hasCompleted, prefetchedUrls, onPrefetched, onAllPrefetched]);

  return {
    elementRef,
    prefetchedUrls,
    isPrefetching,
    hasCompleted,
  };
}
