import { Component } from '@angular/core';
import { Gyroscope, GyroscopeOrientation, GyroscopeOptions } from '@ionic-native/gyroscope/ngx';
import * as moment from 'moment';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  status: string = "Starting up";
  adjustment_period = 10000;

  passengers: number = -1;
  x: number = null;
  y: number = null;
  z: number = null;
  timestamp: number = null;

  prev_x: number = null;
  prev_y: number = null;
  prev_z: number = null;
  elapsed_time = null;

  neutral_x: number = null;
  neutral_y: number = null;
  neutral_z: number = null;
  first_timestamp = null;

  constructor(private gyroscope: Gyroscope) {
    let options: GyroscopeOptions = {
       frequency: 100
    }

    this.gyroscope.watch(options)
     .subscribe((orientation: GyroscopeOrientation) => {
       console.log('o:',orientation)
       console.log(' - :',moment(orientation.timestamp))

       // For the first 10 seconds, gather the 'neutral' position
       if (!this.first_timestamp) {   // Save first timestamp
         this.first_timestamp = moment(orientation.timestamp);
       } else {
          // Calculate how long it's been since beginning
         this.elapsed_time = moment.duration(this.first_timestamp.diff(moment(orientation.timestamp))).as('seconds')*-1;

         if (this.elapsed_time < 10) {
           this.status = "Determining neutral position";
           if (!this.neutral_x) {
             this.neutral_x = orientation.x;
           } else {
             this.neutral_x = (this.neutral_x + orientation.x) / 2;
           }

           if (!this.neutral_y) {
             this.neutral_y = orientation.y;
           } else {
             this.neutral_y = (this.neutral_y + orientation.y) / 2;
           }

           if (!this.neutral_z) {
             this.neutral_z = orientation.z;
           } else {
             this.neutral_z = (this.neutral_z + orientation.z) / 2;
           }
         }
       }

       this.prev_x = this.x;
       this.prev_y = this.y;
       this.prev_z = this.z;

       this.x = orientation.x;
       this.y = orientation.y;
       this.z = orientation.z;
       this.timestamp = orientation.timestamp;
     });
  }

}
