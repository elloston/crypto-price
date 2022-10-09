<template>
  <div>
    <div class="header container mx-auto border rounded border-slate-100">
      <div class="grid grid-cols-3">
        <div class="add-ticker border rounded border-slate-200">
          <p class="add-ticker__label">Тикер</p>
          <input
            class="add-ticker__input"
            v-model="ticker.FROMSYMBOL"
            type="text"
            placeholder="Например DOGE"
          />
        </div>
      </div>

      <button
        class="add-ticker-button pagination-button border rounded border-slate-300"
        @click="addTicker()"
      >
        Добавить
      </button>
    </div>

    <div class="container mx-auto">
      <div class="grid grid-cols-3">
        <div class="ticker-filter border rounded border-slate-200">
          <button @click="filterTickers">
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.5 17.5L12.5 12.5M14.1667 8.33333C14.1667 11.555 11.555 14.1667 8.33333 14.1667C5.11167 14.1667 2.5 11.555 2.5 8.33333C2.5 5.11167 5.11167 2.5 8.33333 2.5C11.555 2.5 14.1667 5.11167 14.1667 8.33333Z"
                stroke="#9CA3AF"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <input
            class="ticker-filter__input"
            v-model="filterKeywords.current"
            type="text"
            placeholder="Найти тикер"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3">
        <div
          @click="setActiveTicker(ticker)"
          class="card border rounded border-slate-200"
          v-for="(ticker, index) in paginatedTickers"
          :key="index"
        >
          <p class="card__ticker-title">{{ ticker.FROMSYMBOL }}</p>

          <p class="card__ticker-price">{{ ticker.PRICE ? ticker.PRICE : "" }}$</p>

          <button @click="deleteTicker(ticker)" class="card-delete">
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.8335 5.83333L15.1107 15.9521C15.0484 16.8243 14.3227 17.5 13.4483 17.5H6.55203C5.67763 17.5 4.9519 16.8243 4.8896 15.9521L4.16683 5.83333M8.3335 9.16667V14.1667M11.6668 9.16667V14.1667M12.5002 5.83333V3.33333C12.5002 2.8731 12.1271 2.5 11.6668 2.5H8.3335C7.87326 2.5 7.50016 2.8731 7.50016 3.33333V5.83333M3.3335 5.83333H16.6668"
                stroke="#9CA3AF"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div class="chart-wrapper">
        <canvas id="myChart"></canvas>
      </div>
    </div>

    <div v-if="filteredTickers.length > rowsLimit" class="footer-pagination">
      <div class="container mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-2">
          <div class="invisible md:visible">
            <p>Показано {{ paginatedTickers.length }} результатов из {{ liveTickers.length }}</p>
          </div>

          <div>
            <button
              @click="changePage('prev')"
              class="pagination-button border rounded border-slate-300"
            >
              Назад
            </button>
            <button
              @click="changePage('next')"
              class="pagination-button border rounded border-slate-300"
            >
              Вперед
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import idb from "@/api/idb";
import Chart from "chart.js/auto";

export default {
  name: "HomeView",
  data: () => ({
    connection: null,
    apiKey: "",

    filterKeywords: {
      active: null,
      current: null,
    },
    filterKeys: null,
    liveTickers: [],
    ticker: {
      FROMSYMBOL: "",
    },

    rowsLimit: 6,
    currentPage: 1,
  }),
  computed: {
    filteredTickers() {
      let filteredTickers = this.liveTickers;

      if (this.filterKeywords.active) {
        filteredTickers = filteredTickers.filter((ticker) => {
          return ticker.FROMSYMBOL.includes(this.filterKeywords.active);
        });
      }

      return filteredTickers;
    },
    paginatedTickers() {
      let paginateTickers = this.filteredTickers;

      if (paginateTickers.length > this.rowsLimit) {
        paginateTickers = paginateTickers.slice(
          (this.currentPage - 1) * this.rowsLimit,
          this.currentPage * this.rowsLimit
        );
      }

      return paginateTickers;
    },
  },
  methods: {
    filterTickers() {
      this.filterKeywords.active = this.filterKeywords.current;
      this.currentPage = 1;
    },
    changePage(action) {
      switch (action) {
        case "next":
          if (this.currentPage * this.rowsLimit < this.liveTickers.length) {
            this.currentPage++;
          }
          break;
        case "prev":
          if (this.currentPage > 1) {
            this.currentPage--;
          }
      }
    },
    async addTicker() {
      let data = {
        action: "SubAdd",
        subs: [`2~Coinbase~${this.ticker.FROMSYMBOL}~USD`],
      };

      try {
        this.connection.send(JSON.stringify(data));

        let newTicker = Object.assign({}, this.ticker);
        await idb.addTicker(newTicker);

        this.liveTickers.push(newTicker);
      } catch (e) {
        console.error(e);
      }

      this.ticker.FROMSYMBOL = null;
    },
    deleteTicker(ticker) {
      let data = {
        action: "SubRemove",
        subs: [`2~Coinbase~${this.ticker.FROMSYMBOL}~USD`],
      };

      try {
        this.connection.send(JSON.stringify(data));

        idb.deleteTicker(ticker);

        let index = this.liveTickers.findIndex((el) => el.FROMSYMBOL == ticker.FROMSYMBOL);
        this.liveTickers.splice(index, 1);
      } catch (e) {
        console.error(e);
      }
    },
    subscribeToTickers(subs) {
      let data = {
        action: "SubAdd",
        subs: subs,
      };

      this.connection.send(JSON.stringify(data));
    },
    setActiveTicker(ticker) {
      //this.createChart();
    },
    createChart() {
      const ctx = document.getElementById("myChart");
      const myChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: [""],
          datasets: [
            {
              data: [1],
              backgroundColor: [
                "rgba(255, 99, 132, 0.2)",
                "rgba(54, 162, 235, 0.2)",
                "rgba(255, 206, 86, 0.2)",
                "rgba(75, 192, 192, 0.2)",
                "rgba(153, 102, 255, 0.2)",
                "rgba(255, 159, 64, 0.2)",
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(153, 102, 255, 1)",
                "rgba(255, 159, 64, 1)",
              ],
              borderWidth: 1,
            },
            {
              data: [2],
              backgroundColor: [
                "rgba(255, 99, 132, 0.2)",
                "rgba(54, 162, 235, 0.2)",
                "rgba(255, 206, 86, 0.2)",
                "rgba(75, 192, 192, 0.2)",
                "rgba(153, 102, 255, 0.2)",
                "rgba(255, 159, 64, 0.2)",
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(153, 102, 255, 1)",
                "rgba(255, 159, 64, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              display: false,
            },
          },
          responsive: true,
          scales: {
            y: {
              display: false,
            },
            x: {
              display: false,
            },
          },
        },
      });

      myChart;
    },
  },
  created() {
    this.connection = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${this.apiKey}`);

    this.connection.onopen = async (event) => {
      let tickers = await idb.getTickers();
      let subs = [];

      tickers.forEach((ticker) => {
        subs.push(`2~Coinbase~${ticker.FROMSYMBOL}~USD`);
      });

      this.subscribeToTickers(subs);

      this.liveTickers = tickers;
    };

    this.connection.onmessage = (event) => {
      let data = JSON.parse(event.data);

      if (data.PRICE) {
        let index = this.liveTickers.findIndex((el) => el.FROMSYMBOL == data.FROMSYMBOL);
        this.liveTickers[index].PRICE = data.PRICE;
      }
    };

    this.connection.onclose = (event) => {};

    this.connection.onerror = (event) => {};
  },
};
</script>

<style lang="scss">
.header {
  padding: 15px;
  margin-top: 15px;
  margin-bottom: 15px;
  background-color: #fff;
}
.add-ticker {
  padding: 5px 10px;
}
.add-ticker__label {
  font-size: 12px;
}
.add-ticker__input {
  width: 100%;
  background-color: unset;
}
.add-ticker__input:focus,
.add-ticker__input:focus-visible {
  outline: none;
  background-color: unset;
}

.ticker-filter {
  display: flex;
  padding: 5px 10px;
  background-color: #fff;
}
.ticker-filter__input {
  margin-left: 5px;
  width: auto;
}
.ticker-filter__input:focus {
  outline: none;
}

.card {
  position: relative;
  padding: 10px 15px;
  margin: 15px 15px 0 15px;

  background-color: #fff;
}
.card__ticker-title {
  font-size: 12px;
}
.card__ticker-price {
  font-size: 24px;
}
.card-delete {
  position: absolute;
  top: 10px;
  right: 15px;
}

.footer-pagination {
  margin-top: 30px;
  border-top: 2px;
  border-style: solid;
  border-color: #e5e7eb;

  bottom: 15px;
}
.pagination-button {
  padding: 5px 10px;
  background-color: #fff;
}
.add-ticker-button {
  font-weight: 300;
  font-size: 12px;
  margin-top: 5px;
  color: #fff;
  padding: 10px 20px;
  background-color: #471f7a;
}
</style>
