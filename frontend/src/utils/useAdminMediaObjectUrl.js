import { useEffect, useState } from "react";
import { fetchAdminMediaBlob } from "../services/adminApi";

const adminMediaObjectUrlCache = new Map();

function acquireObjectUrl(contentUrl) {
  let entry = adminMediaObjectUrlCache.get(contentUrl);

  if (!entry) {
    entry = {
      refs: 0,
      objectUrl: "",
      promise: fetchAdminMediaBlob(contentUrl).then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        entry.objectUrl = objectUrl;

        if (entry.refs <= 0) {
          URL.revokeObjectURL(objectUrl);
          adminMediaObjectUrlCache.delete(contentUrl);
        }

        return objectUrl;
      }).catch((error) => {
        adminMediaObjectUrlCache.delete(contentUrl);
        throw error;
      }),
    };

    adminMediaObjectUrlCache.set(contentUrl, entry);
  }

  entry.refs += 1;
  return entry.promise;
}

function releaseObjectUrl(contentUrl) {
  const entry = adminMediaObjectUrlCache.get(contentUrl);

  if (!entry) {
    return;
  }

  entry.refs -= 1;

  if (entry.refs <= 0 && entry.objectUrl) {
    URL.revokeObjectURL(entry.objectUrl);
    adminMediaObjectUrlCache.delete(contentUrl);
  }
}

export function useAdminMediaObjectUrl(asset, { enabled = true } = {}) {
  const contentUrl = asset?.content_url || "";
  const shouldLoad = Boolean(enabled && contentUrl);
  const [resource, setResource] = useState({
    contentUrl: "",
    objectUrl: "",
    errorMessage: "",
  });

  useEffect(() => {
    if (!shouldLoad) {
      return undefined;
    }

    let isMounted = true;

    acquireObjectUrl(contentUrl)
      .then((url) => {
        if (isMounted) {
          setResource({
            contentUrl,
            objectUrl: url,
            errorMessage: "",
          });
        }
      })
      .catch((error) => {
        if (isMounted) {
          setResource({
            contentUrl,
            objectUrl: "",
            errorMessage:
              error?.userMessage || "No se pudo cargar la vista previa.",
          });
        }
      });

    return () => {
      isMounted = false;
      releaseObjectUrl(contentUrl);
    };
  }, [contentUrl, shouldLoad]);

  const isCurrentResource = resource.contentUrl === contentUrl;
  const objectUrl = shouldLoad && isCurrentResource ? resource.objectUrl : "";
  const errorMessage =
    shouldLoad && isCurrentResource ? resource.errorMessage : "";

  return {
    objectUrl,
    errorMessage,
    isLoading: shouldLoad && !objectUrl && !errorMessage,
  };
}
