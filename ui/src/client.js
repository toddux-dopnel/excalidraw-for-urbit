const APP_NAME = 'excalidraw';

export const deleteEntry = (id, onSuccess, onError) => {
  window.urbit.poke({
    app: APP_NAME,
    mark: `${APP_NAME}-action`,
    json: { del: { id: id } },
    onError,
  });
  onSuccess();
};

export const createEntry = (id, txt, onSuccess, onError) => {
  window.urbit.poke({
    app: APP_NAME,
    mark: `${APP_NAME}-action`,
    json: { add: { id: id, txt: txt } },
    onSuccess,
    onError,
  });
};

export const editEntry = (id, txt, onSuccess, onError) => {
  window.urbit.poke({
    app: APP_NAME,
    mark: `${APP_NAME}-action`,
    json: { edit: { id: id, txt: txt } },
    onSuccess,
    onError,
  });
};

export const getUpdates = async (latestUpdate) => {
  const since = latestUpdate === null ? Date.now() : latestUpdate;
  const path = `/updates/since/${since}`;
  return window.urbit.scry({
    app: APP_NAME,
    path: path,
  });
};

export const reconnect = (
  latestUpdate,
  onInit,
  onError,
  setSubEvent,
  onSubscribeError,
  onSubscribeKick,
) => {
  window.urbit.reset();
  if (latestUpdate === null) {
    onInit();
  } else {
    getUpdates(latestUpdate).then((result) => {
      result.logs.map(setSubEvent);
      subscribe(setSubEvent, onSubscribeError, onSubscribeKick);
    }, onError);
  }
};

export const subscribe = (setSubEvent, onError, onKick) => {
  try {
    window.urbit.subscribe({
      app: APP_NAME,
      path: '/updates',
      event: setSubEvent,
      err: onError,
      quit: onKick,
    });
  } catch {
    onError();
  }
};

export const getEntries = async (entries) => {
  const e = entries;
  const before = e.length === 0 ? Date.now() : e[e.length - 1].id;
  const max = 10;
  const path = `/entries/before/${before}/${max}`;
  return window.urbit.scry({
    app: APP_NAME,
    path: path,
  });
};

export const searchEntries = async (inputStart, inputEnd) => {
  const start = Math.max(inputStart.getTime(), 0);
  const end = Math.max(inputEnd.getTime(), 0);
  return window.urbit.scry({
    app: APP_NAME,
    path: `/entries/between/${start}/${end}`,
  });
};
