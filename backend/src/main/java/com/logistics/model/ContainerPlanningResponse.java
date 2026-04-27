package com.logistics.model;

import java.util.List;

public class ContainerPlanningResponse {
    private Container container;
    private List<Cargo> cargoList;

    public ContainerPlanningResponse() {}

    public ContainerPlanningResponse(Container container, List<Cargo> cargoList) {
        this.container = container;
        this.cargoList = cargoList;
    }

    public Container getContainer() {
        return container;
    }

    public void setContainer(Container container) {
        this.container = container;
    }

    public List<Cargo> getCargoList() {
        return cargoList;
    }

    public void setCargoList(List<Cargo> cargoList) {
        this.cargoList = cargoList;
    }
}
