return of({}).pipe(
  switchMap(() => this.freeApiService.getDummy()),
  tap(response => {
    this.response(response);
  }),
  delay(2000),
  repeat()
);
