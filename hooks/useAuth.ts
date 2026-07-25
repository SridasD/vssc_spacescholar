import { useEffect, useState } from "react";

const useAuth = () => {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    // Get the cookie value
    const cookieValue = document.cookie.replace(
      /(?:(?:^|.*;\s*)x-user-data\s*\=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
 

    // Check if we have a cookie value
    if (!cookieValue) {
      console.log("No x-user-data cookie found");
      return;
    }

    // Try decoding it if it's URI encoded
    try {
      const decodedValue = decodeURIComponent(cookieValue); 

      if (decodedValue) {
        const userData = JSON.parse(decodedValue); 

        if (userData && userData.name) {
          setUserName(userData.name);
        }
      }
    } catch (error) {
      console.error("Failed to parse user data from cookie:", error);
      console.log("Cookie value that failed to parse:", cookieValue);
    }
  }, []);

  return userName;
};

export default useAuth;
