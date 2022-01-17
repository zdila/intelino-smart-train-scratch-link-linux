import { initBle, Session } from "./ble";
import { toIntelinoSession } from "./intelinoSession";

initBle()
  .then(({ createSession, close }) => startSession(createSession(), close))
  .catch((err) => {
    console.error(err);
  });

async function startSession(session: Session, close: () => void) {
  console.log("Scanning");

  const connPromise = new Promise((resolve, reject) => {
    session.on("discover", (dev) => {
      console.log("Connecting");

      session.connect(dev.peripheralId).then(resolve, reject);
    });
  });

  await session.discover([{ namePrefix: "intelino" }]);

  await connPromise;

  console.log("Connected");

  const {
    setTopLedColor,
    getVersionInfo,
    on,
    getStatsLifetimeOdometer,
    getMacAddress,
    getUuid,
    driveAtSpeedLevel,
    stopDriving,
  } = await toIntelinoSession(session);

  on("message", (m) => {
    if (m.type === "EventSplitDecision") {
      console.log(m);
    } else if (m.type === "EventColorChanged" && m.color === "magenta") {
      stopDriving("endRoute").finally(() => {
        close();
      });
    }
  });

  await setTopLedColor(255, 0, 255);

  console.log("Version", await getVersionInfo());
  console.log("MAC", await getMacAddress());
  console.log("UUID", await getUuid());
  console.log("ODO", await getStatsLifetimeOdometer());

  await driveAtSpeedLevel(2);

  // await pauseDriving(10, true);
}