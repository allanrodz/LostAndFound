import { Component, OnInit, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.page.html',
  styleUrls: ['./statistics.page.scss'],
})
export class StatisticsPage implements OnInit {

  @ViewChild('clubLocationChart', { static: true }) clubLocationChart: any;
  @ViewChild('itemsOverTimeChart', { static: true }) itemsOverTimeChart: any;
  @ViewChild('categoryChart') categoryChart!: any;

  collectedItems: any[] = []; // Store collected items for the table

  constructor(private firestore: AngularFirestore) {}

  ngOnInit() {
    this.loadItemsLoggedByClubLocation();
    this.generateCollectedItemsOverTimeChart();
    this.loadCollectedItems(); // Load items for the scrollable table
  }

  loadItemsLoggedByClubLocation() {
    this.firestore.collection('items').valueChanges().subscribe(items => {
      const clubCounts: { [key: string]: number } = {};  // Define the type explicitly

      items.forEach((item: any) => {
        if (item.club) {
          clubCounts[item.club] = (clubCounts[item.club] || 0) + 1;
        }
      });

      const chartData = {
        labels: Object.keys(clubCounts),
        datasets: [{
          label: 'Items Logged by Club',
          data: Object.values(clubCounts),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      };

      this.renderBarChart(chartData, this.clubLocationChart);
    });
  }

  generateCollectedItemsOverTimeChart() {
    this.firestore.collection('collectedItems').valueChanges().subscribe((items: any) => {
      const collectedItemsByDate: { [key: string]: number } = {};
  
      items.forEach((item: any) => {
        const collectedDate = new Date(item.collectedDate).toLocaleDateString(); // Format date to 'MM/DD/YYYY'
        collectedItemsByDate[collectedDate] = (collectedItemsByDate[collectedDate] || 0) + 1;
      });

      const chartData = {
        labels: Object.keys(collectedItemsByDate), // Dates as labels
        datasets: [{
          label: 'Items Collected Over Time',
          data: Object.values(collectedItemsByDate), // Number of items collected per date
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.1 // Makes the line smoother
        }]
      };

      this.renderLineChart(chartData, this.itemsOverTimeChart);
    });
  }


  loadCollectedItems() {
    this.firestore.collection('collectedItems').valueChanges().subscribe((items: any[]) => {
      this.collectedItems = items; // Load the collected items for the table
    });
  }

  renderBarChart(chartData: any, chartElement: any) {
    new Chart(chartElement.nativeElement, {
      type: 'bar',
      data: chartData,
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  renderLineChart(chartData: any, chartElement: any) {
    new Chart(chartElement.nativeElement, {
      type: 'line',
      data: chartData,
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
}
