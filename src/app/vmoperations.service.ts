import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class VmoperationsService {
  public certData: string;
  private baseUrl: string = 'https://udacity-vm-manager.azurewebsites.net';

  constructor(private httpClient: HttpClient) {
  }

  public checkCert(): Observable<any> {
    let cert = {'cert': this.certData};
    return this.httpClient.post(this.baseUrl + '/api/status', cert, {observe: 'response'});
  }

  public checkVM(): Observable<string> {
    let cert = {'cert': this.certData};
    return this.httpClient.post<string>(this.baseUrl + '/api/status', cert);
  }

  public startVM(): Observable<string> {
    let cert = {'cert': this.certData};
    return this.httpClient.post<string>(this.baseUrl + '/api/start', cert);
  }

  public stopVM(): Observable<string> {
    let cert = {'cert': this.certData};
    return this.httpClient.post<string>(this.baseUrl + '/api/stop', cert);
  }
}
