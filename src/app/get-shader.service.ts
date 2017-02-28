import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class GetShaderService {

  constructor(private http: Http) { }
  getProgram(shaderName): Observable<string> {
    return this.http.get('assets/' + shaderName).map(response => response.text());
  }
}
