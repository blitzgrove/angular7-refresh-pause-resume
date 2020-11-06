import { Component, OnDestroy } from "@angular/core";
import { Subject, timer, of } from "rxjs";
import {
  switchMap,
  tap,
  takeUntil,
  filter,
  take,
  map,
  finalize
} from "rxjs/operators";

import { freeApiService } from "./freeapi.service";

export const REFRESH_INTERVAL = 11;

@Component({
  selector: "my-app",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnDestroy {
  pause$ = new Subject();
  reset$ = new Subject();
  closed$ = new Subject();
  counter = REFRESH_INTERVAL;
  res: any;
  paused = false;
  polling = false;

  constructor(private freeApiService: freeApiService) {}

  ngOnInit() {
    this.init();
  }

  init() {
    let first = true; // <-- start polling anew
    this.reset$
      .pipe(
        switchMap(refresh => {
          return refresh
            ? of(refresh)
            : timer(0, 1000).pipe(
                take(this.counter),
                tap(_ => {
                  this.polling = true;
                  this.paused =
                    this.paused && !this.polling ? false : this.paused;
                }),
                takeUntil(this.pause$),
                filter(_ => first || --this.counter === 0),
                finalize(() => {
                  this.paused =
                    this.counter != 0 && !this.polling ? true : this.paused;
                })
              );
        }),
        switchMap(refresh => this.freeApiService.getDummy()),
        takeUntil(this.closed$)
      )
      .subscribe({
        next: res => {
          first = false;
          this.res = res;
          this.counter = REFRESH_INTERVAL;
          if (this.polling) {
            this.reset$.next();
          }
        },
        error: error => console.log("Error fethcing data:", error)
      });
  }

  ngOnDestroy() {
    this.closed$.next();
  }
}
