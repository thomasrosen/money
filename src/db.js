let db_cache = null;

function db_init_inner() {
  return new Promise((resolve_db, reject_db) => {
    const dbName = 'database';

    const request = window.indexedDB.open(dbName, 2); // 2 is the version

    request.onerror = event => {
      // Handle errors.
      console.error('database-error', event);
      reject_db('database-error');
    };
    request.onblocked = event => {
      // If some other tab is loaded with the database, then it needs to be closed before we can proceed.
      alert('Please close all other tabs with this site open!')
    }
    request.onupgradeneeded = event => {
      const db = event.target.result;

      Promise.all([
        // create all tables/objectStores

        new Promise(resolve => {
          // Create an objectStore to hold information.
          const objectStore_invoices = db.createObjectStore('invoices', { keyPath: 'id' })
          objectStore_invoices.createIndex('place_name', 'place_name', { unique: false, locale: 'auto' })
          objectStore_invoices.createIndex('cost_sum', 'cost_sum', { unique: false })
          // Use transaction oncomplete to make sure the objectStore creation is
          // finished before adding data into it.
          objectStore_invoices.transaction.oncomplete = event => {
            resolve()
          }
        }),

      ])
        .then(() => {
          resolve_db(db)
        })
    }
    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve_db(db)
      return;
    }
  });
}

async function db_init() {
  if (db_cache === null) {
    const db = await db_init_inner()
    db.onversionchange = event => {
      db.close()
      alert('A new version of this page is ready. Please reload or close this tab!')
    }

    db_cache = db
  }

  return db_cache;
}

function db_row_add(table, new_data) {
  return new Promise(async (resolve, reject) => {

    // make sure new data is in the correct format (array of objects)
    if (!Array.isArray(new_data)) {
      new_data = [new_data]
    }

    new_data = new_data
      .filter(row => typeof row === 'object' && row !== null) // it needs to be an object
      .filter(row => row.hasOwnProperty('id') && typeof row.id === 'string' && row.id.length > 0) // make sure id exists, id is a string and not empty

    // error if there is no data
    if (new_data.length === 0) {
      reject('new_data must be an array of objects that are not null')
    }

    // get database, prepare transaction and get objectStore
    const db = await db_init()
    const transaction = db.transaction([table], 'readwrite')
    const objectStore = transaction.objectStore(table)

    // Do something when all the data is added to the database.
    transaction.oncomplete = (event) => {
      console.log("All done!");
      resolve()
    };

    transaction.onerror = (event) => {
      // Don't forget to handle errors!
      reject(event)
    };

    // add the data
    new_data.forEach(new_row => {
      /* const request = */ objectStore.add(new_row)
      // request.onsuccess = (event) => {
      //   // event.target.result === customer.ssn
      // }
    })
  })
}

function db_row_get(table, id) {
  return new Promise(async (resolve, reject) => {
    const db = await db_init()
    db
      .transaction(table)
      .objectStore(table)
      .get(id).onsuccess = event => {
        resolve(event.target.result)
      }
  })
}

function db_row_delete(table, id) {
  return new Promise(async (resolve, reject) => {
    const db = await db_init()
    const request = db
      .transaction([table], "readwrite")
      .objectStore(table)
      .delete(id);

    request.onsuccess = (event) => {
      // It's gone!
      resolve();
    };
    request.onerror = (event) => {
      reject(event);
    };
  });
}

function db_row_update(table, new_data) {
  return new Promise(async (resolve, reject) => {
    const db = await db_init()

    const id = new_data.id

    const objectStore = db
      .transaction([table], "readwrite")
      .objectStore(table);
    const request = objectStore.get(id)
    request.onerror = (event) => {
      // Handle errors!
      reject(event)
    }
    request.onsuccess = (event) => {
      const data = {
        // Get the old value that we want to update
        ...event.target.result,
        // update the value(s) in the object that you want to change
        ...new_data,
      }

      // Put this updated object back into the database.
      const requestUpdate = objectStore.put(data);
      requestUpdate.onerror = (event) => {
        // Do something with the error
        reject(event)
      }
      requestUpdate.onsuccess = (event) => {
        // Success - the data is updated!
        resolve()
      }
    }
  })
}

function db_row_get_all(table) {
  return new Promise(async (resolve, reject) => {
    const db = await db_init()

    const objectStore = db
      .transaction([table], "readwrite")
      .objectStore(table);

    objectStore.getAll().onsuccess = event => {
      resolve(event.target.result)
    };
  })
}

export {
  db_init,
  db_row_add,
  db_row_delete,
  db_row_get,
  db_row_get_all,
  db_row_update,
}

/*



Strictly return as JSON:
- place_name (as one string)
- place_address (as one string)
- datetime (yyyy-MM-dd HH:mm:ss Z)
- as an array: items (name, quantity, price_per_quantity and price_total (as string with currency and 000.00))

Currency is in euros (€) if not specified otherwise.
Be precise with all the values.



Schema:

Invoices:
- id [uuid]
// - date_created [iso date]
// - date_modified [iso date]
- data_issued [iso date]
- place_name [string]
- place_address [string]
- cost_sum [number]
- cost_sum_currency [string]
// - amount_of_tip [number]
// - amount_of_tip_currency [string]
// - way_of_payment [string]
- items [array of ids]
- images [array of ids]

Items:
- id [uuid]
// - date_created [iso date]
// - date_modified [iso date]
- name [string]
- quantity [number]
// - price_per_quantity [number]
// - price_per_quantity_currency [string]
- price_total [number]
- price_total_currency [string]
// - categories [array of strings]

Images:
- id [uuid]
// - date_created [iso date]
// - date_modified [iso date]
- filename [string]
- extracted_text [string]
- original_image [blob]
// - corrected_image [blob]

Blobs: ???
- id
- blob

*/
