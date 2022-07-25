import * as ko from "knockout";
import * as Constants from "../../../../../constants";
import template from "./api-list.html";
import { Component, RuntimeComponent, OnMounted, Param } from "@paperbits/common/ko/decorators";
import { Api } from "../../../../../models/api";
import { ApiService } from "../../../../../services/apiService";
import { TagGroup } from "../../../../../models/tagGroup";
import { SearchQuery } from "../../../../../contracts/searchQuery";
import { RouteHelper } from "../../../../../routing/routeHelper";
import { Tag } from "../../../../../models/tag";
import { Operation } from "../../../../../models/operation";
import { Page } from "../../../../../models/page";


@RuntimeComponent({
    selector: "api-list"
})
@Component({
    selector: "api-list",
    template: template
})
export class ApiList {
    public readonly apis: ko.ObservableArray<Api>;
    public readonly apiGroups: ko.ObservableArray<TagGroup<Api>>;
    public readonly working: ko.Observable<boolean>;
    public readonly pattern: ko.Observable<string>;
    public readonly tags: ko.Observable<Tag[]>;
    public readonly groupByTag: ko.Observable<boolean>;
    public readonly pageNumber: ko.Observable<number>;
    public readonly totalPages: ko.Observable<number>;
    public readonly expanded: ko.Observable<boolean>;
    public readonly operationGroupsdata: ko.ObservableArray<TagGroup<Operation>>;
    constructor(
        private readonly apiService: ApiService,
        private readonly routeHelper: RouteHelper
    ) {
        this.detailsPageUrl = ko.observable();
        this.allowSelection = ko.observable(false);
        this.showApiType = ko.observable(true);
        this.apis = ko.observableArray([]);
        this.working = ko.observable();
        this.pattern = ko.observable();
        this.tags = ko.observable([]);
        this.pageNumber = ko.observable(1);
        this.totalPages = ko.observable(0);
        this.apiGroups = ko.observableArray();
        this.groupByTag = ko.observable(false);
        this.defaultGroupByTagToEnabled = ko.observable(false);
        this.expanded = ko.observable(false);
        this.operationGroupsdata = ko.observableArray([]);
    }

    @Param()
    public allowSelection: ko.Observable<boolean>;

    @Param()
    public showApiType: ko.Observable<boolean>;

    @Param()
    public defaultGroupByTagToEnabled: ko.Observable<boolean>;

    @Param()
    public detailsPageUrl: ko.Observable<string>;

    @OnMounted()
    public async initialize(): Promise<void> {
        this.groupByTag(this.defaultGroupByTagToEnabled());
        this.tags.subscribe(this.resetSearch);
        this.pattern
            .extend({ rateLimit: { timeout: Constants.defaultInputDelayMs, method: "notifyWhenChangesStop" } })
            .subscribe(this.resetSearch);

        this.groupByTag
            .subscribe(this.resetSearch);

        this.pageNumber
            .subscribe(this.loadPageOfApis);
    }

    public async loadStaticFiles(fileName): Promise<void> {
        var items = document.getElementById("operation-details");
        items.hidden = true;
        var divEle = document.getElementById("divContent");
        divEle.hidden = false;
        const fetchResult = fetch(fileName)
        const response = await fetchResult;
        const jsonData = await response.text();
        divEle.innerHTML = jsonData;
    }

    private async loadPageOfOperations(apiname: string): Promise<void> {

        const pageOfOperations = await this.apiService.getOperations(`apis/${apiname}`);

        // this.operations(pageOfOperations.value);
    }
    /**
     * Loads page of APIs.
     */
    public async loadPageOfApis(): Promise<void> {
        const pageNumber = this.pageNumber() - 1;

        const query: SearchQuery = {
            pattern: this.pattern(),
            tags: this.tags(),
            skip: pageNumber * Constants.defaultPageSize,
            take: Constants.defaultPageSize
        };

        try {
            this.working(true);

            let totalItems: number;

            if (this.groupByTag()) {
                const pageOfTagResources = await this.apiService.getApisByTags(query);
                const apiGroups = pageOfTagResources.value;

                this.apiGroups(apiGroups);
                totalItems = pageOfTagResources.count;
            }
            else {
                const pageOfApis = await this.apiService.getApis(query);
                const apis = pageOfApis ? pageOfApis.value : [];

                this.apis(apis);
                totalItems = pageOfApis.count;
            }

            this.totalPages(Math.ceil(totalItems / Constants.defaultPageSize));
            this.loadStaticFiles('/introduction.html');
        }
        catch (error) {
            throw new Error(`Unable to load APIs. Error: ${error.message}`);
        }
        finally {
            this.working(false);
        }
    }

    public getReferenceUrl(api: Api): string {
        return this.routeHelper.getApiReferenceUrl(api.name, this.detailsPageUrl());
    }

    public async resetSearch(): Promise<void> {
        this.pageNumber(1);
        this.loadPageOfApis();
    }

    public async onTagsChange(tags: Tag[]): Promise<void> {
        this.tags(tags);
    }

    public toggle(api: Api): boolean {

        return this.expanded(!this.expanded());
    }

    public async loadOperations(id: string, apiname: Api): Promise<void> {
        var items = document.getElementById("operation-details");
        items.hidden = false;
        var divEle = document.getElementById("divContent");
        divEle.hidden=true;
        const pageOfOperationsByTag = await this.apiService.getOperationsByTags(apiname.name);
        const operations = pageOfOperationsByTag ? pageOfOperationsByTag.value : [];
        var item = document.getElementById('phApi' + id);
        if (item.children.length == 0) {
            var operationDetails = this.formOperations(apiname.name, operations);
            var htmlToBind = "<ul class='flex-column pl-2 nav' >" + operationDetails + "</ul>";
            item.insertAdjacentHTML('beforeend', htmlToBind);
        }
    }

    private getOperationReferenceUrl(operationName: string, apiName: string): string {
        return this.routeHelper.getOperationReferenceUrl(apiName, operationName, this.detailsPageUrl());
    }

    private formOperations(apiName: string, operations: TagGroup<Operation>[]): string {
        var opItems = "";
        operations[0].items.forEach(element => {
            var url = this.getOperationReferenceUrl(element.name, apiName);
            opItems += "<li class='nav-item'> <a  class='nav-link py-0' href= "+ url+" ><div class='row'><span class='APIMethod APIMethod_fixedWidth APIMethod_"+element.method.toLowerCase() + " Sidebar-link-textLuTE1ySm4Kqn'  'data-method ='"+element.method + "'>"+ element.method+" </span> <span class=''  title= "+ element.displayName+" \">"+ element.displayName+" </span> </div></a></li>  "; });
        return opItems;
    }
}