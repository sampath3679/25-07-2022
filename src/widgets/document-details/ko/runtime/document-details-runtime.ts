
import * as ko from "knockout";
import template from "./document-details-runtime.html";
import { HttpClient, HttpRequest } from "@paperbits/common/http";
import { Component, RuntimeComponent, Param, OnMounted, OnDestroyed } from "@paperbits/common/ko/decorators";
import { widgetRuntimeSelector } from "../..";
import { RouteHelper } from "../../../../../src/routing/routeHelper";




@RuntimeComponent({
    selector: widgetRuntimeSelector
})
@Component({
    selector: widgetRuntimeSelector,
    template: template
})
export class DocumentDetailsRuntime {
    public readonly sessionDescription: ko.Observable<string>;
    public documentApiUrl: string;

    constructor(private readonly httpClient: HttpClient, private readonly routeHelper: RouteHelper) {
        this.fileName = ko.observable();
        this.api = ko.observable();
        this.sessionDescription = ko.observable();
    }

    @Param()
    public readonly fileName: ko.Observable<string>;
    public readonly api: ko.Observable<string>;
    @OnMounted()
    public async initialize(): Promise<void> {
        const api = this.routeHelper.getApiName();
        var viewName = this.routeHelper['router']['currentRoute'].hash;
        if (viewName == 'introduction') {
            this.documentApiUrl = "https://phstorageaccount01.blob.core.windows.net/$web/introduction.html";
        } else if (viewName == 'environments') {
            this.documentApiUrl = "https://phstorageaccount01.blob.core.windows.net/$web/Environments.htm";
        } else if (viewName == 'authentication') {
            this.documentApiUrl = "https://phstorageaccount01.blob.core.windows.net/$web/Authentication.htm";
        }
        const request: HttpRequest = {
            url: `${this.documentApiUrl}`,
            method: "GET"
        };
        const response = await this.httpClient.send<string>(request);
        const sessionDescription = response.toText();

        this.sessionDescription(sessionDescription);
        this.api(api);
    }
}