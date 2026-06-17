import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "../services/analytics";

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({
      hitType: "pageview",
      page: location.pathname,
    });
  }, [location]);

  return null;
}

export default AnalyticsTracker;
