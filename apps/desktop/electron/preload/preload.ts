import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('flowAgent', {
  platform: process.platform,
});

