import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MemberInquiryPage } from './member-inquiry.page';

describe('MemberInquiryPage', () => {
  let component: MemberInquiryPage;
  let fixture: ComponentFixture<MemberInquiryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberInquiryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
