import { Component, OnInit, OnDestroy } from '@angular/core';
import { VmoperationsService } from '../vmoperations.service';
import { timer, of, Observable, Subject, interval } from 'rxjs';
import { switchMap, takeUntil, catchError, startWith } from 'rxjs/operators';
import { Timestamp } from 'rxjs/internal/operators/timestamp';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  private killTrigger: Subject<void> = new Subject();
  public certData: string;
  public fetchData: string = 'No information yet';
  private lastSuccessfulStatus: string;
  private lastFullStatus: string;
  private timerInterval: number = 5000;
  private lastSuccessfulCheck: Date;
  private lastFullStatusCount: number = 0;
  private timerStarted = false;

  constructor(private vmOperations: VmoperationsService) {
  }

  ngOnInit() {
  }

  ngOnDestroy(){
    this.killTrigger.next();
  }

  public startTimer(event) : void {
    if (this.timerStarted === false) {
      this.vmOperations.certData = event;
      if (this.vmOperations.certData.length > 0) {
        //this.fetchData$ = this.vmOperations.checkVM();
        interval(this.timerInterval)
        .pipe<string>(
          startWith(0),
          // This kills the request if the user closes the component
          takeUntil(this.killTrigger),
          // switchMap cancels the last request, if no response have been received since last tick
          switchMap(() => this.vmOperations.checkVM()),
          // catchError handles http throws
          catchError(error => of(error))
        ).subscribe(res => {
          this.timerStarted = true;
          console.log(res);
          let keys = Object.keys(res).sort();
          if (keys.includes('error')) {
            this.fetchData = 'Authentication error';
            this.timerStarted = false;
            this.killTrigger.next();
            return;
          }
          this.fetchData = res;
          switch (this.fetchData) {
            case 'starting':
            case 'running':
            case 'deallocating':
            case 'deallocated':
            case 'stopped':
              if (
                (this.lastFullStatus === 'running' || this.lastFullStatus === 'stopped')
                && (this.fetchData === 'deallocated' || this.fetchData === 'stopped')) {
                // decrease the interval to reduce the requests to the azure functions
                this.timerInterval = 10000;
              } else if (
                (this.lastFullStatus === 'deallocated' || this.lastFullStatus === 'stopped')
                && (this.fetchData === 'running' || this.fetchData === 'stopped')) {
                // decrease the interval to reduce the requests to the azure functions
                this.timerInterval = 10000;
              }
              this.lastSuccessfulStatus = this.fetchData;
              this.lastSuccessfulCheck = new Date();
              break;
          }

          switch (this.fetchData) {
            case 'running':
            case 'deallocated':
              if (this.lastFullStatus === this.fetchData) {
                ++this.lastFullStatusCount;
                if (this.lastFullStatusCount >= 10) {
                  // decrease the interval to reduce the requests to the azure functions
                  this.timerInterval = 10000;
                }
              }
              this.lastFullStatus = this.fetchData;
              break;
          }
        });
      }
    }
  }

  public startVM(): void {
    // timeout in milliseconds since the last successful vm status check
    let time: number = new Date().getTime() - this.lastSuccessfulCheck.getTime();
    // check if there is a cert provided, the last successful status was 'deallocated' -> the vm is shutdown
    // and the last vm status check is not older than 50000 milliseconds
    // to be sure, that the cert is still valid
    if (
      this.vmOperations.certData.length > 0
      && (this.lastSuccessfulStatus === 'deallocated' || this.lastSuccessfulStatus === 'stopped' || this.lastSuccessfulStatus === 'No information yet')
      && time < 50000) {
      this.vmOperations.startVM().subscribe((response: string) => {
        console.log(response);
        this.timerInterval = 5000;
      });
    }
  }

  public stopVM(): void {
    // timeout in milliseconds since the last successful vm status check
    let time: number = new Date().getTime() - this.lastSuccessfulCheck.getTime();
    // check if there is a cert provided, the last successful status was 'deallocated' -> the vm is shutdown
    // and the last vm status check is not older than 50000 milliseconds
    // to be sure, that the cert is still valid
    if (
      this.vmOperations.certData.length > 0
      && (this.lastSuccessfulStatus === 'running' || this.lastSuccessfulStatus === 'stopped' || this.lastSuccessfulStatus === 'No information yet')
      && time < 50000) {
      this.vmOperations.stopVM().subscribe((response: string) => {
        console.log(response);
        this.timerInterval = 5000;
      });
    }
  }

}
