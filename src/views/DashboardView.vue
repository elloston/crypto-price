<template>
  <div>
    <div class="container mx-auto">
      <div class="md:rounded p-4 md:m-4 bg-white">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="border rounded-md border-slate-300 pl-4 py-2">
            <p class="text-xs">Тикер</p>

            <input
              class="bg-transparent w-full outline-none"
              v-model="ticker.FROMSYMBOL"
              type="text"
              placeholder="Например DOGE"
            />
          </div>
        </div>

        <button
          class="rounded-md mt-4 px-7 py-3 font-normal bg-indigo-900 text-white"
          @click="addTicker()"
        >
          Добавить
        </button>
      </div>
    </div>

    <div class="container mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          class="flex flex-row border rounded-md border-slate-300 ml-4 mr-4 md:mr-0 mt-4 px-3 bg-white"
        >
          <button @click="filterTickers" class="mr-1">
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
            class="bg-transparent ml-2 py-2 w-full font-light text-md outline-none"
            v-model="filterKeywords.current"
            type="text"
            placeholder="Найти тикер"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 m-4">
        <div
          @click="setActiveTicker(ticker)"
          class="border rounded-md border-slate-200 bg-white relative"
          v-for="(ticker, index) in paginatedTickers"
          :key="index"
        >
          <p class="pt-3 pl-6 text-sm">{{ ticker.FROMSYMBOL }}</p>

          <p class="pb-3 pl-6 pt-0 text-3xl">{{ ticker.PRICE ? ticker.PRICE : "" }}$</p>

          <button @click="deleteTicker(ticker)" class="absolute top-3 right-4">
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

    <div v-if="filteredTickers.length > rowsLimit" class="fixed bottom-0 left-0 w-full">
      <div class="container mx-auto bg-white md:bg-transparent border-t md:border-none">
        <div
          class="grid items-center justify-between grid-cols-1 md:grid-cols-2 md:border-t py-4 mx-4"
        >
          <p class="hidden md:inline text-md">
            Показано {{ paginatedTickers.length }} результатов из {{ liveTickers.length }}
          </p>

          <div class="flex justify-between md:justify-end">
            <button
              @click="changePage('prev')"
              class="border rounded-md border-slate-300 py-2 px-5 bg-white"
            >
              Назад
            </button>

            <button
              @click="changePage('next')"
              class="border rounded-md border-slate-300 py-2 px-5 bg-white ml-2"
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
  name: "DashboardView",
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
