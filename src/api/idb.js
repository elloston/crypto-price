const DB_NAME = 'CryptoPrice';
const DB_VERSION = 1.0;

export default {
  async getDb() {
    return new Promise((resolve, reject) => {
      let openRequest = indexedDB.open(DB_NAME, DB_VERSION);
      
      openRequest.onupgradeneeded = () => {
        let db = openRequest.result;
          
        db.createObjectStore("tickers", { autoIncrement: true, keyPath:'FROMSYMBOL' });
      };
        
      openRequest.onerror = () => {
        reject(openRequest.error)
      };
    
      openRequest.onsuccess = () => {
        resolve(openRequest.result)
      };
    })
  },
  
  async getTickers() {
    let db = await this.getDb();

    return new Promise(resolve => {
      let trans = db.transaction('tickers', 'readonly')
      const folders = []

      trans.oncomplete = () => {
        resolve(folders)
      }

      const store = trans.objectStore('tickers')

      store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result
        if (cursor) {
          folders.push(cursor.value)
          cursor.continue()
        }
      }

    })
  },

  async addTicker(ticker) {
    let db = await this.getDb();

    return new Promise(resolve => {
      let trans = db.transaction(['tickers'], 'readwrite');
      
      trans.oncomplete = () => {
        resolve();
      };

      let store = trans.objectStore('tickers');
      store.put(ticker);

    });
  },
  
  async deleteTicker(ticker) {
    let db = await this.getDb();

    return new Promise(resolve => {

      let trans = db.transaction(['tickers'], 'readwrite');
      trans.oncomplete = () => {
        resolve();
      };

      let store = trans.objectStore('tickers');
      store.delete(ticker.FROMSYMBOL);
    });
  },
  
}