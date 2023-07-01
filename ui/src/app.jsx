import React, { useState, useEffect } from 'react';
import Urbit from '@urbit/http-api';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  Stack,
  Toast,
  ToastContainer,
  Button,
  Spinner,
  Alert,
} from 'react-bootstrap';
import { BottomScrollListener } from 'react-bottom-scroll-listener';
import {
  createEntry,
  editEntry,
  reconnect,
  subscribe,
  getEntries,
} from './client';
import Entry from './entry';
import RemoveModal from './remove-modal';
import ClearModal from './clear-modal';
import CreateEntry from './create-entry';
import { serializeAsJSON, Excalidraw, Footer } from '@excalidraw/excalidraw';

export default function App() {
  const [confirmClearOpened, setConfirmClearOpened] = useState(false);
  const [drawingName, setDrawingName] = useState(null);
  const [subEvent, setSubEvent] = useState({});
  const [latestUpdate, setLatestUpdate] = useState(null);
  const [status, setStatus] = useState(null);

  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [initialDrawing, setInitialDrawing] = useState(null);
  const [initialAppState, setInitialAppState] = useState(null);
  const [drawing, setDrawing] = useState(null);
  const [appState, setAppState] = useState(null);
  const [dirty, setDirty] = useState(false);

  const [errorCount, setErrorCount] = useState(0);
  const [errors, setErrors] = useState(new Map());

  const [entries, setEntries] = useState([]);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [entryToEdit, setEntryToEdit] = useState(null);

  const [isGalleryOpened, setIsGalleryOpened] = useState(true);

  const addError = (msg) => {
    const id = errorCount + 1;
    setErrors(new Map(errors.set(id, msg)));
    setErrorCount(id);
  };

  const rmError = (id) => {
    errors.delete(id);
    setErrors(new Map(errors));
  };

  const saveOrUpdateDrawing = () => {
    const jsonData = serializeAsJSON(drawing, appState);
    const parsed = JSON.parse(jsonData);
    parsed.name = drawingName;
    const base64Representation = btoa(JSON.stringify(parsed));
    if (entryToEdit) {
      editEntry(
        entryToEdit,
        base64Representation,
        () => setStatus('success'),
        () => setStatus('err'),
      );
    } else {
      const id = Date.now();
      setEntryToEdit(id);
      createEntry(
        id,
        base64Representation,
        () => setStatus('success'),
        () => setStatus('err'),
      );
    }
  };

  const createNewDrawing = (drawingName) => {
    setDrawingName(drawingName);
    setEntryToEdit(null);
    setDirty(false);
    setDrawing([]);
    setAppState({});
    hideGallery();
  };

  const clearCurrentDrawing = () => {
    setInitialDrawing([]);
    setInitialAppState({});
  };

  useEffect(() => {
    loadDrawing(initialDrawing, initialAppState);
  }, [initialDrawing, initialAppState, isGalleryOpened]);

  const loadDrawing = () => {
    if (initialDrawing && initialAppState) {
      excalidrawAPI.updateScene({
        elements: initialDrawing,
        appState: initialAppState,
        scrollToContent: true,
      });
    }
  };

  const openDrawing = (id, name, txt) => {
    setEntryToEdit(id);
    setDrawingName(name);
    const initialDrawing = JSON.parse(atob(txt));
    setDrawing(initialDrawing.elements);
    setAppState(initialDrawing.appState);
    hideGallery();
  };

  useEffect(() => {
    window.urbit = new Urbit('');
    window.urbit.ship = window.ship;

    window.urbit.onOpen = () => setStatus('con');
    window.urbit.onRetry = () => setStatus('try');
    window.urbit.onError = () => setStatus('err');

    getEntries(entries).then(
      (result) => {
        setSubEvent(result);
        setLatestUpdate(result.time);
        subscribe(
          setSubEvent,
          () => addError('Subscription error'),
          () => addError('Kicked from subscription'),
        );
        if (result.entries.length > 0) {
          const defaultDrawing = result.entries[0];
          const drawing = JSON.parse(atob(defaultDrawing.txt));
          openDrawing(defaultDrawing.id, drawing.name, defaultDrawing.txt);
        }
      },
      (err) => {
        addError('Connection failed');
        setStatus('err');
      },
    );
  }, []);

  useEffect(() => {
    const getDataIndex = (id, data) => {
      let low = 0;
      let high = data.length;
      while (low < high) {
        let mid = (low + high) >>> 1;
        if (data[mid].id > id) low = mid + 1;
        else high = mid;
      }
      return low;
    };

    if (subEvent.time !== latestUpdate) {
      if ('entries' in subEvent) {
        const [existing, incoming] = [entries, subEvent.entries];
        const oldestExistingId =
          existing.length === 0 ? Date.now() : existing[existing.length - 1].id;
        let newestIncomingInd = getDataIndex(oldestExistingId, incoming);
        newestIncomingInd +=
          newestIncomingInd < incoming.length &&
          incoming[newestIncomingInd].id >= oldestExistingId;
        setEntries(existing.concat(incoming.slice(newestIncomingInd)));
      } else if ('add' in subEvent) {
        const { time, add } = subEvent;
        const eInd = getDataIndex(add.id, entries);
        const toE =
          entries.length === 0 || add.id > entries[entries.length - 1].id;
        toE && entries.splice(eInd, 0, add);
        toE && setEntries([...entries]);
        setLatestUpdate(time);
      } else if ('edit' in subEvent) {
        const { time, edit } = subEvent;
        const eInd = entries.findIndex((e) => e.id === edit.id);
        const toE = eInd !== -1;
        if (toE) entries[eInd] = edit;
        toE && setEntries([...entries]);
        setLatestUpdate(time);
      } else if ('del' in subEvent) {
        const { time, del } = subEvent;
        const eInd = entries.findIndex((e) => e.id === del.id);
        const toE = eInd !== -1;
        toE && entries.splice(eInd, 1);
        toE && setEntries([...entries]);
        setLatestUpdate(time);
      }
    }
  }, [subEvent]);

  const getOperationStatus = () => {
    if (status === 'try') {
      return 'warning';
    }
    if (status === 'err') {
      return 'danger';
    }

    if (status === 'success') {
      return 'success';
    }
  };

  const openGallery = () => {
    setIsGalleryOpened(true);
  };

  const hideGallery = () => {
    setIsGalleryOpened(false);
  };

  return (
    <React.Fragment>
      <RemoveModal
        deleteId={entryToDelete}
        handleClose={() => {
          setEntryToDelete(null);
        }}
        onSuccess={() => {
          setEntryToDelete(null);
          createNewDrawing();
          openGallery();
        }}
        setError={addError}
      />
      <ClearModal
        show={confirmClearOpened}
        handleClose={() => {
          setConfirmClearOpened(false);
        }}
        onConfirm={() => {
          clearCurrentDrawing();
          setConfirmClearOpened(false);
        }}
      />
      {!isGalleryOpened ? (
        <div
          className="urb"
          style={{
            width: '100%',
            height: '100vh',
          }}
        >
          <Excalidraw
            ref={(api) => setExcalidrawAPI(api)}
            initialData={{
              elements: drawing,
              appState: appState,
              scrollToContent: true,
            }}
            renderTopRightUI={() => {
              return (
                <>
                  <Button
                    variant="info"
                    onClick={() => {
                      setConfirmClearOpened(true);
                    }}
                    disabled={!entryToEdit && !dirty}
                  >
                    Clear Canvas
                  </Button>
                  <Button
                    style={{ marginLeft: '5px' }}
                    variant="warning"
                    onClick={openGallery}
                  >
                    See All Drawings
                  </Button>
                </>
              );
            }}
            onChange={(drawing, appState) => {
              setAppState(appState);
              setDrawing(drawing);
              if (drawing.length > 0) {
                setDirty(true);
              }
            }}
          >
            <Footer>
              <Button
                style={{ marginLeft: '10px' }}
                variant="success"
                onClick={saveOrUpdateDrawing}
              >
                Save
              </Button>
              <Button
                variant="danger"
                style={{ marginLeft: '10px' }}
                disabled={!entryToEdit}
                onClick={() => {
                  setEntryToDelete(entryToEdit);
                }}
              >
                Delete
              </Button>
            </Footer>
          </Excalidraw>
        </div>
      ) : (
        <div className="m-3 d-flex justify-content-center">
          <Toast
            style={{ maxWidth: '75rem', width: '100%' }}
            onClose={entries.length > 0 ? hideGallery : null}
          >
            <Toast.Header>
              <strong className="me-auto" style={{ fontSize: '20px' }}>
                Drawings Collection
              </strong>
              <small></small>
            </Toast.Header>
            <Toast.Body>
              <BottomScrollListener
                onBottom={() =>
                  getEntries(entries).then(
                    (result) => setSubEvent(result),
                    (err) => addError('Fetching more entries failed'),
                  )
                }
              >
                {() => {
                  if (entries.length > 0) {
                    return (
                      <>
                        <Stack gap={1} className="p-2 d-flex">
                          <CreateEntry
                            onCreate={createNewDrawing}
                          ></CreateEntry>
                          {entries.map((e) => {
                            const getName = () => {
                              const drawing = JSON.parse(atob(e.txt));
                              return drawing.name;
                            };
                            const name = getName();
                            console.log(name);
                            return (
                              <Entry
                                key={e.id}
                                entry={e}
                                name={name}
                                onEdit={openDrawing}
                              />
                            );
                          })}
                        </Stack>
                      </>
                    );
                  } else {
                    return (
                      <>
                        <Stack gap={1} className="p-2 d-flex">
                          <CreateEntry
                            onCreate={createNewDrawing}
                          ></CreateEntry>
                        </Stack>
                        <Alert
                          key={'warning'}
                          variant={'warning'}
                          style={{
                            margin: '100px',
                          }}
                        >
                          <Alert.Heading>
                            You don't have drawings yet!
                          </Alert.Heading>
                          This tab contains the list with your Excalidraw
                          drawings. You don't have any yet. Create your first
                          one above.
                        </Alert>
                      </>
                    );
                  }
                }}
              </BottomScrollListener>
            </Toast.Body>
          </Toast>
        </div>
      )}
      <ToastContainer
        style={{
          position: 'sticky',
          bottom: 0,
          width: '100%',
          zIndex: 50,
        }}
      >
        {[...errors].map(([id, txt]) => (
          <Toast
            key={id}
            className="ms-auto"
            onClose={() => rmError(id)}
            show={true}
            delay={3000}
            autohide
            style={{ width: 'fit-content' }}
          >
            <Toast.Header className="d-flex justify-content-between">
              {txt}
            </Toast.Header>
          </Toast>
        ))}
        <Toast
          bg={getOperationStatus()}
          className="w-100"
          onClose={() => setStatus(null)}
          show={status === 'try' || status === 'err' || status === 'success'}
          delay={status === 'success' ? 2000 : null}
          autohide={status === 'success'}
        >
          <Toast.Body
            className="d-flex justify-content-center align-items-center"
            onClick={
              status === 'err'
                ? () =>
                    reconnect(
                      latestUpdate,
                      () => {
                        getEntries(entries).then(
                          (result) => {
                            setSubEvent(result);
                            setLatestUpdate(result.time);
                            subscribe(
                              () => addError('Subscription error'),
                              () => addError('Kicked from subscription'),
                            );
                          },
                          (err) => {
                            addError('Connection failed');
                            setStatus('err');
                          },
                        );
                      },
                      (err) => {
                        addError('Connection failed');
                        setStatus('err');
                      },
                      setSubEvent,
                      () => addError('Subscription error'),
                      () => addError('Kicked from subscription'),
                    )
                : null
            }
            role={status === 'err' ? 'button' : undefined}
          >
            <strong style={{ color: 'white' }}>
              {status === 'try' && (
                <Spinner animation="border" size="sm" className="me-1" />
              )}
              {status === 'try' && 'Reconnecting'}
              {status === 'err' && 'Reconnect'}
              {status === 'success' && 'Drawing successfully saved.'}
            </strong>
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </React.Fragment>
  );
}
