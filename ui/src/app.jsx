import React, { useEffect, useState } from 'react';
import { Excalidraw } from "@excalidraw/excalidraw";
import Urbit from '@urbit/http-api';
import { scryCharges } from '@urbit/api';

const api = new Urbit('', '', window.desk);
api.ship = window.ship;

export function App() {
  const [apps, setApps] = useState();

  useEffect(() => {
    async function init() {
      const charges = (await api.scry(scryCharges)).initial;
      setApps(charges);
    }

    init();
  }, []);

  return (
    <div className="App">
      <div style={{ height: "600px" }}>
        <Excalidraw />
      </div>
    </div>
  );
}
