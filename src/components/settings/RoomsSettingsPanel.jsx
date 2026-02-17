import React, { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import store from '../../store/appStore';
import {
  Card,
  Typography,
  Divider,
  Space,
  Button,
  InputNumber,
  Input,
  Modal,
  Tooltip,
  theme as antdTheme,
} from 'antd';
import { PlusOutlined, DeleteOutlined, RightOutlined, ArrowLeftOutlined, UndoOutlined, WarningOutlined } from '@ant-design/icons';
import { rooms as defaultRooms } from '../../data';

const { Title, Text } = Typography;

function RoomsSettingsPanel(props) {
  const [activeRoomKey, setActiveRoomKey] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomKey, setNewRoomKey] = useState('');
  const [roomQuery, setRoomQuery] = useState('');
  const { changed = false, onReset, onDetailChange } = props;
  const { token } = antdTheme.useToken();
  const titleColor = token.colorTextSecondary || '#ddd';

  const filteredRooms = useMemo(() => {
    const q = (roomQuery || '').trim().toLowerCase();
    if (!q) return store.rooms;
    return store.rooms.filter((r) =>
      (r.name || '').toLowerCase().includes(q) || (r.key || '').toLowerCase().includes(q)
    );
  }, [roomQuery, store.rooms]);

  const renderRoomList = () => (
    <>
      <>
        <Title level={5}>Настройка помещений</Title>
        <Text type="secondary">Выберите помещение для настройки параметров газов</Text>
      </>
      <Divider />

      <div>
        <div style={{ margin: '0 8px' }}>
          <Input.Search
            placeholder="Поиск помещений"
            allowClear
            value={roomQuery}
            onChange={(e) => setRoomQuery(e.target.value)}
          />
        </div>
        <br/>
        <Card
          style={{ background: 'transparent', borderRadius: 14, margin: '0 8px', border: `1px solid ${token.colorBorder}`, overflow: 'hidden' }}
          bodyStyle={{ padding: 0 }}
        >
          {filteredRooms.length === 0 && (
            <div style={{ padding: '12px 16px', color: titleColor }}>Ничего не найдено</div>
          )}
          {filteredRooms.map((room, idx) => (
            <div
              key={room.key}
              onClick={() => { setActiveRoomKey(room.key); if (onDetailChange) onDetailChange(true); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: idx === filteredRooms.length - 1 ? 'none' : `1px solid ${token.colorSplit}`,
                width: '100%'
              }}
            >
              <div style={{ flex: 1, minWidth: 0, paddingRight: 12, overflow: 'hidden' }}>
                <Text
                  style={{ display: 'block', fontSize: 14, color: titleColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}
                  title={room.name}
                >
                  {room.name}
                </Text>
              </div>
              <RightOutlined style={{ color: '#aaa' }} />
            </div>
          ))}
        </Card>

        <br />

        <Card
          style={{
            margin: '0 8px',
            overflow: 'hidden',
            borderRadius: 14,
            border: `1px solid ${token.colorBorder}`,
          }}
          bodyStyle={{ padding: 0 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onClick={() => setAddModalVisible(true)}
          >
            <Space align="center" size={12}>
              <span style={{ fontSize: 20 }}>
                <PlusOutlined />
              </span>
              <Text style={{ fontSize: 14, color: titleColor }}>Создать новое помещение</Text>
            </Space>
            <RightOutlined style={{ fontSize: 12 }} />
          </div>
        </Card>

        <br />

        {changed && (
          <Card
            style={{
              borderRadius: 14,
              margin: '0 8px',
              overflow: 'hidden',
              border: `1px solid ${token.colorBorder}`,
            }}
            bodyStyle={{ padding: 0 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onClick={() => { store.resetRooms(); setActiveRoomKey(null); }}
            >
              <Space align="center" size={12}>
                <span style={{ fontSize: 20 }}>
                  <UndoOutlined />
                </span>
                <Text style={{ fontSize: 14, color: titleColor }}>Сбросить настройки помещений</Text>
              </Space>
              <RightOutlined style={{ fontSize: 12 }} />
            </div>
          </Card>
        )}
      </div>
    </>
  );
 

  const defaultRoomMap = useMemo(() => new Map((defaultRooms || []).map((r) => [r.key, r])), []);

  const isOverridden = (room, gasKey) => {
    const defaults = defaultRoomMap.get(room.key);
    const defEntry = defaults && (defaults.gases || []).find((g) => g.key === gasKey);
    const curEntry = (room.gases || []).find((g) => g.key === gasKey) || {};
    const fields = ['flowRate', 'hoursPerDay', 'usageFactor'];

    if (!defEntry) {
      // В таблице не было этого газа — считаем переопределением, если пользователь задал какие-либо значения
      return fields.some((f) => curEntry[f] !== undefined);
    }

    // Был в таблице — переопределение, если явно задано и отличается от табличного
    return fields.some((f) => curEntry[f] !== undefined && curEntry[f] !== defEntry[f]);
  };

  const resetRoomGasToDefault = (roomKey, gasKey) => {
    const defaults = defaultRoomMap.get(roomKey);
    const defEntry = defaults && (defaults.gases || []).find((g) => g.key === gasKey);

    store.setRooms(
      store.rooms.map((r) => {
        if (r.key !== roomKey) return r;
        const gases = Array.isArray(r.gases) ? [...r.gases] : [];
        const idx = gases.findIndex((g) => g.key === gasKey);
        if (defEntry) {
          if (idx >= 0) {
            gases[idx] = { ...defEntry };
          } else {
            gases.push({ ...defEntry });
          }
        } else {
          // no default for this gas in this room: remove entry
          if (idx >= 0) gases.splice(idx, 1);
        }
        return { ...r, gases };
      })
    );
  };

  const renderRoomDetail = (roomKey) => {
    const room = store.rooms.find((r) => r.key === roomKey);
    if (!room) return null;

    const resetEntireRoom = (rk) => {
      const defaults = defaultRoomMap.get(rk);
      store.setRooms(
        store.rooms.map((r) => {
          if (r.key !== rk) return r;
          if (defaults && Array.isArray(defaults.gases)) {
            // сбрасываем параметры газов помещения к табличным
            return { ...r, gases: defaults.gases.map((g) => ({ ...g })) };
          }
          // если в таблице такого помещения нет — очистить пользовательские значения
          return { ...r, gases: [] };
        })
      );
    };

    const isRoomParamsChanged = (rm) => {
      const defaults = defaultRoomMap.get(rm.key);
      const fields = ['flowRate', 'hoursPerDay', 'usageFactor'];
      const curGases = Array.isArray(rm.gases) ? rm.gases : [];

      if (!defaults) {
        // Комната не в таблице — считаем изменённой, только если есть какие-то заданные параметры
        return curGases.some((g) => fields.some((f) => g[f] !== undefined));
      }

      const defGases = Array.isArray(defaults.gases) ? defaults.gases : [];
      const defMap = new Map(defGases.map((g) => [g.key, g]));

      // 1) Поля, отличные от дефолтных (учитываем только явно заданные)
      for (const cg of curGases) {
        const dg = defMap.get(cg.key);
        if (!dg) {
          // добавлен газ, которого нет в таблице, с любыми заданными полями
          if (fields.some((f) => cg[f] !== undefined)) return true;
          continue;
        }
        if (fields.some((f) => cg[f] !== undefined && cg[f] !== dg[f])) return true;
      }

      // 2) Случай, когда в таблице поле было, а пользователь его явно задал равным дефолту — не считаем изменением
      return false;
    };

    return (
      <>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'nowrap' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0 }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => { setActiveRoomKey(null); if (onDetailChange) onDetailChange(false); }} />
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <Title
                level={5}
                style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}
                title={room.name}
              >
                {room.name}
              </Title>
            </div>
          </div>
          <Space style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
            {isRoomParamsChanged(room) && (
              <Button onClick={() => { resetEntireRoom(room.key); if (onDetailChange) onDetailChange(false); }}>Сбросить параметры</Button>
            )}
            
            <Button danger icon={<DeleteOutlined />} onClick={() => { store.removeRoom(room.key); setActiveRoomKey(null); if (onDetailChange) onDetailChange(false); }}>Удалить помещение</Button>
          </Space>
        </div>
        <Divider />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {store.gases.map((gas) => {
            const entry = (room.gases || []).find((g) => g.key === gas.key) || {};
            return (
              <Card key={gas.key} size="small">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 18, color: gas.color }}>{gas.icon}</span>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <Text
                        style={{ fontSize: 14, color: titleColor, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}
                        title={gas.label}
                      >
                        {gas.label}
                      </Text>
                    </div>
                  </div>
                  {/* Фиксированная колонка действий для ровного выравнивания */}
                  <div style={{ width: 36, display: 'flex', justifyContent: 'flex-end' }}>
                    {isOverridden(room, gas.key) && (
                      <Tooltip
                        placement="top"
                        title={
                          <div>
                            <div>Этот параметр был изменен вручную</div>
                            <div style={{ marginTop: 6, textAlign: 'right' }}>
                              <Button type="link" size="small" onClick={() => resetRoomGasToDefault(room.key, gas.key)}>Сброс</Button>
                            </div>
                          </div>
                        }
                      >
                        <WarningOutlined style={{ color: '#FAAD14', cursor: 'pointer' }} />
                      </Tooltip>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 2 }}>
                    <div style={{ width: 100 }}>
                      <Text style={{ display: 'block', fontSize: 12 }}>Расход (л/мин)</Text>
                      <InputNumber
                        min={0}
                        value={entry.flowRate ?? undefined}
                        onChange={(v) => store.setRoomGasParam(room.key, gas.key, 'flowRate', v)}
                      />
                    </div>
                    <div style={{ width: 100 }}>
                      <Text style={{ display: 'block', fontSize: 12 }}>Часов/сут</Text>
                      <InputNumber
                        min={0}
                        value={entry.hoursPerDay ?? undefined}
                        onChange={(v) => store.setRoomGasParam(room.key, gas.key, 'hoursPerDay', v)}
                      />
                    </div>
                    <div style={{ width: 100 }}>
                      <Text style={{ display: 'block', fontSize: 12 }}>Коэфф.</Text>
                      <InputNumber
                        min={0}
                        step={0.1}
                        value={entry.usageFactor ?? undefined}
                        onChange={(v) => store.setRoomGasParam(room.key, gas.key, 'usageFactor', v)}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <>
      {!activeRoomKey ? renderRoomList() : renderRoomDetail(activeRoomKey)}

      <Modal
        title="Добавить помещение"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onOk={() => {
          const key = newRoomKey && newRoomKey.trim() ? newRoomKey.trim() : newRoomName.toLowerCase().replace(/\s+/g, '_');
          if (!key) return;
          store.addRoom({ key, name: newRoomName || key, gases: [] });
          setAddModalVisible(false);
          setNewRoomKey('');
          setNewRoomName('');
          setActiveRoomKey(key);
          if (onDetailChange) onDetailChange(true);
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Input placeholder="Имя помещения" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
        </div>
      </Modal>
    </>
  );
};

export default observer(RoomsSettingsPanel);
