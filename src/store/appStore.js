import { makeAutoObservable, runInAction, observable } from "mobx";
import { autorun } from "mobx";
import { gases as defaultGases, rooms as defaultRooms } from "../data";

const GASES_STORAGE_KEY = "gases-settings";
const THEME_STORAGE_KEY = "app-theme";
const ROOMS_STORAGE_KEY = "rooms-settings";

class AppStore {
  gases = [];
  rooms = [];
  theme = "system";

  constructor() {
    // Make 'gases' a shallow observable array so its items (which contain React icons)
    // are not converted to observable proxies. We always replace items immutably.
    makeAutoObservable(this, { gases: observable.shallow });

    // initialize from defaults then merge persisted values
    this.gases = defaultGases.map((d) => ({ ...d }));
    this.rooms = defaultRooms.map((r) => ({ ...r }));

    try {
      const raw = localStorage.getItem(GASES_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved)) {
          this.gases = defaultGases.map((d) => ({
            ...d,
            ...(saved.find((x) => x.key === d.key) || {}),
          }));
        }
      }
    } catch (e) {
      // ignore
    }

    // Ensure each gas has linkedRooms set (derived from defaultRooms if present)
    try {
      const defaultRoomMap = new Map(defaultRooms.map((r) => [r.key, r]));
      this.gases = this.gases.map((g) => {
        if (g.linkedRooms) return g;
        const linked = [];
        for (const room of defaultRooms) {
          if (!room || !Array.isArray(room.gases)) continue;
          if (room.gases.some((rg) => rg.key === g.key)) linked.push(room.key);
        }
        return { ...g, linkedRooms: linked };
      });
    } catch (e) {
      // ignore
    }

    try {
      const t = localStorage.getItem(THEME_STORAGE_KEY);
      if (t) this.theme = t;
    } catch (e) {}

    try {
      const rawRooms = localStorage.getItem(ROOMS_STORAGE_KEY);
      if (rawRooms) {
        const parsed = JSON.parse(rawRooms);
        if (Array.isArray(parsed)) this.rooms = parsed;
      }
    } catch (e) {}

    // persist serializable parts of gases and theme/rooms
    autorun(() => {
      try {
        const toSave = this.gases.map((g) => ({
          key: g.key,
          color: g.color,
          ...(g.label !== undefined ? { label: g.label } : {}),
          ...(g.shortName !== undefined ? { shortName: g.shortName } : {}),
          ...(g.linkedRooms !== undefined ? { linkedRooms: g.linkedRooms } : {}),
          ...(g.flowRate !== undefined ? { flowRate: g.flowRate } : {}),
          ...(g.hoursPerDay !== undefined ? { hoursPerDay: g.hoursPerDay } : {}),
          ...(g.usageFactor !== undefined ? { usageFactor: g.usageFactor } : {}),
        }));
        localStorage.setItem(GASES_STORAGE_KEY, JSON.stringify(toSave));
      } catch (e) {
        // ignore
      }
    });

    autorun(() => {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, this.theme);
      } catch (e) {}
    });

    autorun(() => {
      try {
        localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(this.rooms));
      } catch (e) {}
    });
  }

  setTheme(t) {
    this.theme = t;
  }

  setGases(gasesArray) {
    this.gases = gasesArray.map((g) => ({ ...g }));
  }

  setRooms(roomsArray) {
    this.rooms = roomsArray.map((r) => ({ ...r }));
  }

  setGasColor(key, color) {
    this.gases = this.gases.map((g) => (g.key === key ? { ...g, color } : g));
  }

  setGasParam(key, field, value) {
    this.gases = this.gases.map((g) => (g.key === key ? { ...g, [field]: value } : g));
  }

  setGasLinkedRooms(key, linkedRooms = []) {
    // update gas entry
    this.gases = this.gases.map((g) => (g.key === key ? { ...g, linkedRooms } : g));

    // ensure rooms.gases reflect the linkedRooms list
    // if a room is linked, ensure it contains an entry for the gas (merge defaults if available)
    const defaultRoomMap = new Map(defaultRooms.map((r) => [r.key, r]));

    this.rooms = this.rooms.map((room) => {
      const isLinked = linkedRooms.includes(room.key);
      const hasGas = Array.isArray(room.gases) && room.gases.some((rg) => rg.key === key);

      if (isLinked && !hasGas) {
        // try to get a default entry from defaultRooms
        const defaultRoom = defaultRoomMap.get(room.key);
        const defaultEntry = defaultRoom && Array.isArray(defaultRoom.gases)
          ? defaultRoom.gases.find((dg) => dg.key === key)
          : undefined;

        const newEntry = defaultEntry ? { ...defaultEntry } : { key };
        return { ...room, gases: [...(room.gases || []), newEntry] };
      }

      if (!isLinked && hasGas) {
        return { ...room, gases: (room.gases || []).filter((rg) => rg.key !== key) };
      }

      return room;
    });
  }

  // set a parameter for a gas inside a specific room
  setRoomGasParam(roomKey, gasKey, field, value) {
    this.rooms = this.rooms.map((room) => {
      if (room.key !== roomKey) return room;
      const gases = Array.isArray(room.gases) ? [...room.gases] : [];
      const idx = gases.findIndex((g) => g.key === gasKey);
      if (idx >= 0) {
        gases[idx] = { ...gases[idx], [field]: value };
      } else {
        gases.push({ key: gasKey, [field]: value });
      }
      return { ...room, gases };
    });
  }

  addRoom(room) {
    // room: { key, name, type }
    const r = { ...room, gases: room.gases ? [...room.gases] : [] };
    this.rooms = [...this.rooms, r];
  }

  removeRoom(key) {
    this.rooms = this.rooms.filter((r) => r.key !== key);
  }

  resetRooms() {
    this.rooms = defaultRooms.map((r) => ({ ...r }));
    try {
      localStorage.removeItem(ROOMS_STORAGE_KEY);
    } catch (e) {}
  }

  resetGases() {
    this.gases = defaultGases.map((d) => ({ ...d }));
    try {
      localStorage.removeItem(GASES_STORAGE_KEY);
    } catch (e) {}
  }

  // Room-level operations
  setRoomGasParam(roomKey, gasKey, field, value) {
    this.rooms = this.rooms.map((r) => {
      if (r.key !== roomKey) return r;
      const gases = Array.isArray(r.gases) ? [...r.gases] : [];
      const idx = gases.findIndex((g) => g.key === gasKey);
      if (idx >= 0) {
        gases[idx] = { ...gases[idx], [field]: value };
      } else {
        gases.push({ key: gasKey, [field]: value });
      }
      return { ...r, gases };
    });
  }

  addRoom(room) {
    // room should have { key, name, gases? }
    this.rooms = [...this.rooms, { ...(room || {}) }];
  }

  resetRooms() {
    this.rooms = defaultRooms.map((r) => ({ ...r }));
    try {
      localStorage.removeItem(ROOMS_STORAGE_KEY);
    } catch (e) {}
  }

  removeRoom(roomKey) {
    this.rooms = this.rooms.filter((r) => r.key !== roomKey);
  }
}

const store = new AppStore();
export default store;
