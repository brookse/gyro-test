import { Component } from '@angular/core';
import { Gyroscope, GyroscopeOrientation, GyroscopeOptions } from '@ionic-native/gyroscope/ngx';
import { EmailComposer } from '@ionic-native/email-composer/ngx';
import { ToastController } from '@ionic/angular';

import * as moment from 'moment';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  status: string = "Starting up";
  buffer_period = 5;
  baseline_period = 10;
  test_value = "";
  name = "";
  car = "";

  delta_changes_three = "";
  delta_changes_five = "";
  delta_changes_seven = "";
  delta_changes_one = "";

  delta_count_three = 0;
  delta_count_five = 0;
  delta_count_seven = 0;
  delta_count_one = 0;

  isPaused = false;

  passengers: number = -1;
  x: number = null;
  y: number = null;
  z: number = null;
  timestamp: number = null;

  current_x: number = null;
  current_y: number = null;
  current_z: number = null;
  current_timestamp: number = null;

  prev_x: number = null;
  prev_y: number = null;
  prev_z: number = null;
  elapsed_time = 0;

  neutral_x: number = null;
  neutral_y: number = null;
  neutral_z: number = null;
  first_timestamp = null;

  delta_x: number = null;
  delta_y: number = null;
  delta_z: number = null;

  constructor(private gyroscope: Gyroscope, private emailComposer: EmailComposer, public toast: ToastController) {
    let options: GyroscopeOptions = {
       frequency: 100
    }

    // Observe changes in the gyroscope every 100ms
    this.gyroscope.watch(options)
     .subscribe((orientation: GyroscopeOrientation) => {
       // console.log('o:',orientation)

       // If we're paused, don't do any observations
       if (this.isPaused) {
         return;
       }

       // For the first 10 seconds, gather the 'neutral' position
       if (!this.first_timestamp) {   // Save first timestamp
         this.first_timestamp = moment(orientation.timestamp);
       }

       // Calculate how long it's been since beginning
       this.elapsed_time = moment.duration(this.first_timestamp.diff(moment(orientation.timestamp))).as('seconds')*-1;

       // Determine what state we're in
       if (this.elapsed_time < this.buffer_period) {
         // Waiting for tester to clear
         this.status = "Beginning baseline in " + (this.buffer_period-this.elapsed_time).toFixed(1) + "s";
       } else if (this.elapsed_time < this.baseline_period + this.buffer_period) {
         // Determining neutral position
         this.current_x = orientation.x;
         this.current_y = orientation.y;
         this.current_z = orientation.z;
         this.current_timestamp = orientation.timestamp;
         this.gatherNeutralPosition()
       } else {
         this.status = "Analyzing gyro changes";
         this.prev_x = this.x;
         this.prev_y = this.y;
         this.prev_z = this.z;

         this.x = orientation.x;
         this.y = orientation.y;
         this.z = orientation.z;
         this.timestamp = orientation.timestamp;

         this.updateDelta();
       }

       this.checkDelta();
     });
  }

  updateDelta(){
    this.delta_x = Number((this.x - this.neutral_x).toFixed(2));
    this.delta_y = Number((this.y - this.neutral_y).toFixed(2));
    this.delta_z = Number((this.z - this.neutral_z).toFixed(2));
  }

  // Log any time a significant delta is created
  // This is determined by at least one (but multiple is fine) deltas being above | delta_watch_value |
  checkDelta() {
    let three_string = "";
    if (Math.abs(this.delta_x) > 0.3) {
      three_string = three_string + " X: " + this.delta_x;
    }
    if (Math.abs(this.delta_y) > 0.3) {
      three_string = three_string + " Y: " + this.delta_y;
    }
    if (Math.abs(this.delta_z) > 0.3) {
      three_string = three_string + " Z: " + this.delta_z;
    }

    let five_string = "";
    if (Math.abs(this.delta_x) > 0.5) {
      five_string = five_string + " X: " + this.delta_x;
    }
    if (Math.abs(this.delta_y) > 0.5) {
      five_string = five_string + " Y: " + this.delta_y;
    }
    if (Math.abs(this.delta_z) > 0.5) {
      five_string = five_string + " Z: " + this.delta_z;
    }

    let seven_string = "";
    if (Math.abs(this.delta_x) > 0.7) {
      seven_string = seven_string + " X: " + this.delta_x;
    }
    if (Math.abs(this.delta_y) > 0.7) {
      seven_string = seven_string + " Y: " + this.delta_y;
    }
    if (Math.abs(this.delta_z) > 0.7) {
      seven_string = seven_string + " Z: " + this.delta_z;
    }

    let one_string = "";
    if (Math.abs(this.delta_x) > 1) {
      one_string = one_string + " X: " + this.delta_x;
    }
    if (Math.abs(this.delta_y) > 1) {
      one_string = one_string + " Y: " + this.delta_y;
    }
    if (Math.abs(this.delta_z) > 1) {
      one_string = one_string + " Z: " + this.delta_z;
    }

    if (three_string !== "") { // Add the string if significant delta occurred
      this.delta_changes_three = this.delta_changes_three + " (" + three_string + ")";
      this.delta_count_three++;
    } else {
      this.delta_changes_three = this.delta_changes_three + "   -   ";
    }

    if (five_string !== "") { // Add the string if significant delta occurred
      this.delta_changes_five = this.delta_changes_five + " (" + five_string + ")";
      this.delta_count_five++;
    } else {
      this.delta_changes_five = this.delta_changes_five + "   -   ";
    }

    if (seven_string !== "") { // Add the string if significant delta occurred
      this.delta_changes_seven = this.delta_changes_seven + " (" + seven_string + ")";
      this.delta_count_seven++;
    } else {
      this.delta_changes_seven = this.delta_changes_seven + "   -   ";
    }

    if (one_string !== "") { // Add the string if significant delta occurred
      this.delta_changes_one = this.delta_changes_one + " (" + one_string + ")";
      this.delta_count_one++;
    } else {
      this.delta_changes_one = this.delta_changes_one + "   -   ";
    }
  }

  // Initiate neutral position gathering
  resetPosition() {
    this.first_timestamp = null;
    this.delta_changes_three = "";
    this.delta_changes_five = "";
    this.delta_changes_seven = "";
    this.delta_changes_one = "";
    this.x = null;
    this.y = null;
    this.z = null;
  }

  // Determine a position baseline for the phone
  gatherNeutralPosition() {
     this.status = "Determining neutral position";
     if (!this.neutral_x) {
       this.neutral_x = this.current_x;
     } else {
       this.neutral_x = (this.neutral_x + this.current_x) / 2;
     }

     if (!this.neutral_y) {
       this.neutral_y = this.current_y;
     } else {
       this.neutral_y = (this.neutral_y + this.current_y) / 2;
     }

     if (!this.neutral_z) {
       this.neutral_z = this.current_z;
     } else {
       this.neutral_z = (this.neutral_z + this.current_z) / 2;
     }
  }

  // Start or pause gyro watching
  // If the app is currently paused, reset the position
  toggleWatch() {
    this.isPaused = !this.isPaused;
    if (!this.isPaused) {
      this.resetPosition();
    } else {
      this.status = "Paused";
    }
  }

  sendReport() {
    this.emailComposer.isAvailable().then((available: boolean) =>{
     if(available) {
       //Now we know we can send
     }
    });

    let subject = this.name +" - "+this.car+" - "+ this.test_value;
    let body = "Time start: "+this.first_timestamp + " | elapsed time: " + this.elapsed_time.toFixed(2) + "<br><br>";
        body += "Neutral (X: " + this.neutral_x.toFixed(4) + ", Y: " + this.neutral_y.toFixed(4) + ", Z: " + this.neutral_z.toFixed(4) + ")<br><br>";
        body += "0.3 (" + this.delta_count_three + "): " + this.delta_changes_three + "<br><br>";
        body += "0.5 (" + this.delta_count_five + "): " + this.delta_changes_five + "<br><br>";
        body += "0.7 (" + this.delta_count_seven + "): " + this.delta_changes_seven + "<br><br>";
        body += "1.0 (" + this.delta_count_one + "): " + this.delta_changes_one;

    let email = {
      to: 'lyzzi+gyro@rokkincat.com',
      subject: subject,
      body: body,
      isHtml: true
    }

    // Send a text message using default options
    this.emailComposer.open(email);
    //
    // const t = this.toast.create({
    //   message: 'Email sent!',
    //   duration: 2000
    // });
    // t.present();
  }

  segmentChanged(ev: any) {
    console.log('e:',ev)
    this.test_value = ev.detail.value;
  }

}
